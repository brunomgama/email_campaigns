// API functions for managing scheduled campaigns

export interface Schedule {
  id: string
  campaignId: string
  emailReceiver: string[]
  scheduled_time: string
  variables: Record<string, string>
}

export interface CreateScheduleRequest {
  campaignId: string
  scheduledTime: string
  emailReceiver?: string[]
  variables?: Record<string, string>
}

export interface UpdateScheduleRequest {
  scheduledTime?: string
  emailReceiver?: string[]
  variables?: Record<string, string>
}

export interface ListSchedulesRequest {
  limit?: number
  lastKey?: string
  campaignId?: string
}

export interface ListSchedulesResponse {
  results: Schedule[]
  lastEvaluatedKey?: string
}

class SchedulerApi {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!
  private apiKey = process.env.NEXT_PUBLIC_API_KEY!

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage += ` message: ${errorData.message}`
        }
      } catch {
        // If we can't parse the error response, use the status text
        errorMessage += ` ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  async list(params: ListSchedulesRequest = {}): Promise<ListSchedulesResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.lastKey) {
      searchParams.append('lastKey', params.lastKey)
    }
    if (params.campaignId) {
      searchParams.append('campaignId', params.campaignId)
    }

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/schedule?${queryString}` : '/schedule'
    
    return this.request<ListSchedulesResponse>(endpoint)
  }

  async getOne(id: string): Promise<Schedule> {
    return this.request<Schedule>(`/schedule/${id}`)
  }

  async create(data: CreateScheduleRequest): Promise<{ id: string }> {
    return this.request<{ id: string }>('/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async update(id: string, data: UpdateScheduleRequest): Promise<void> {
    await this.request<void>(`/schedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete(id: string): Promise<void> {
    await this.request<void>(`/schedule/${id}`, {
      method: 'DELETE',
    })
  }
}

export const schedulerApi = new SchedulerApi()