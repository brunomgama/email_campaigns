export interface Audience {
  id: string
  name: string
  local: string
  definition?: string
  audienceTypeId: string
  emailType: 'campaign' | 'automation' | 'functional'
  sql: string
  countRecipients: number
  active: boolean
  createDate: string
  createUser: string
  modifyDate: string
  modifyUser: string
}

export interface AudienceListResponse {
  results: Audience[]
  lastEvaluatedKey?: string
}

export interface AudienceListParams {
  limit: number
  lastKey?: string
  search?: string
}

export interface CreateAudienceRequest {
  name: string
  local: string
  definition?: string
  audienceTypeId: string
  emailType: 'campaign' | 'automation' | 'functional'
  sql: string
  active: boolean
  user: string
}

export interface UpdateAudienceRequest {
  name: string
  local: string
  definition?: string
  audienceTypeId: string
  emailType: 'campaign' | 'automation' | 'functional'
  sql: string
  active: boolean
  user: string
}

export interface CountRecipientsResponse {
  id: string
  countRecipients: number
}

class AudienceApiService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!
  private apiKey = process.env.NEXT_PUBLIC_API_KEY!

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    // Check if response has content and is JSON
    const contentType = response.headers.get("content-type")
    const contentLength = response.headers.get("content-length")
    
    // If no content or content-length is 0, return undefined for void responses
    if (contentLength === "0" || !contentType?.includes("application/json")) {
      const text = await response.text()
      // If it's empty or just a simple message, return undefined for void types
      if (!text || text.trim() === "" || text === "deleted" || text === "success") {
        return undefined as T
      }
      // Try to parse non-JSON responses as text
      return text as T
    }

    return response.json()
  }

  async list(params: AudienceListParams): Promise<AudienceListResponse> {
    const searchParams = new URLSearchParams({
      limit: params.limit.toString(),
    })

    if (params.lastKey) {
      searchParams.append('lastKey', params.lastKey)
    }

    if (params.search) {
      searchParams.append('search', params.search)
    }

    return this.makeRequest<AudienceListResponse>(`/audience?${searchParams.toString()}`)
  }

  async getOne(id: string): Promise<Audience> {
    return this.makeRequest<Audience>(`/audience/${id}`)
  }

  async create(data: CreateAudienceRequest): Promise<Audience> {
    return this.makeRequest<Audience>(`/audience`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async update(id: string, data: UpdateAudienceRequest): Promise<Audience> {
    return this.makeRequest<Audience>(`/audience/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async delete(id: string): Promise<void> {
    await this.makeRequest<void>(`/audience/${id}`, {
      method: "DELETE",
    })
  }

  async countRecipients(id: string): Promise<CountRecipientsResponse> {
    return this.makeRequest<CountRecipientsResponse>(`/audience/recipients?id=${id}`)
  }
}

export const audienceApi = new AudienceApiService()