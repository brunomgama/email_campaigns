// API functions for managing campaigns

export interface Campaign {
  id: string
  name: string
  local: string
  audienceId: string
  senderId: string
  senderAlias: string
  subject: string
  content: string
  templateId: string
  status: 'draft' | 'planned' | 'archived' | 'sent'
  previousStatus: string
  createDate: string
  createUser: string
  modifyDate: string
  modifyUser: string
}

export interface CreateCampaignRequest {
  name?: string
  local?: string
  audienceId?: string
  senderId?: string
  senderAlias?: string
  subject?: string
  content?: string
  templateId?: string
  status?: 'draft' | 'planned' | 'archived' | 'sent'
  user: string
}

export interface UpdateCampaignRequest {
  name?: string
  local?: string
  audienceId?: string
  senderId?: string
  senderAlias?: string
  subject?: string
  content?: string
  templateId?: string
  status?: 'draft' | 'planned' | 'archived' | 'sent'
  user: string
}

export interface ListCampaignsRequest {
  limit?: number
  lastKey?: string
  search?: string
}

export interface ListCampaignsResponse {
  results: Campaign[]
  lastEvaluatedKey?: string
  count: number
}

export interface SendEmailRequest {
  emailId: string
  emailReceiver: string[]
  variables?: Record<string, string>
}

export interface ScheduleEmailRequest {
  campaignId: string
  emailReceiver: string[]
  scheduled_time: string
  variables?: Record<string, string>
}

class CampaignsApi {
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

  async list(params: ListCampaignsRequest = {}): Promise<ListCampaignsResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.lastKey) {
      searchParams.append('lastKey', params.lastKey)
    }
    if (params.search) {
      searchParams.append('search', params.search)
    }

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/campaign?${queryString}` : '/campaign'
    
    return this.request<ListCampaignsResponse>(endpoint)
  }

  async getOne(id: string): Promise<Campaign> {
    return this.request<Campaign>(`/campaign/${id}`)
  }

  async create(data: CreateCampaignRequest): Promise<Campaign> {
    return this.request<Campaign>('/campaign', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async update(id: string, data: UpdateCampaignRequest): Promise<Campaign> {
    return this.request<Campaign>(`/campaign/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete(id: string): Promise<void> {
    await this.request<void>(`/campaign/${id}`, {
      method: 'DELETE',
    })
  }

  async duplicate(id: string): Promise<Campaign> {
    return this.request<Campaign>(`/campaign/${id}`, {
      method: 'POST',
    })
  }

  async sendEmail(data: SendEmailRequest): Promise<void> {
    await this.request<void>('/email/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async scheduleEmail(data: ScheduleEmailRequest): Promise<void> {
    await this.request<void>('/email/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const campaignsApi = new CampaignsApi()