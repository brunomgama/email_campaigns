export interface Sender {
  id: string
  email: string
  alias: string[]
  emailType: string[]
  active: boolean
  createDate: string
  createUser: string
  modifyDate: string
  modifyUser: string
}

export interface SendersListResponse {
  results: Sender[]
  lastEvaluatedKey?: string
}

export interface SendersListParams {
  limit: number
  lastKey?: string
  search?: string
}

export interface CreateSenderRequest {
  email: string
  alias: string[]
  emailType: string[]
  active: boolean
  user: string
}

export interface UpdateSenderRequest {
  email: string
  alias: string[]
  emailType: string[]
  active: boolean
  user: string
}

class SendersApiService {
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

  async list(params: SendersListParams): Promise<SendersListResponse> {
    const searchParams = new URLSearchParams({
      limit: params.limit.toString(),
    })

    if (params.lastKey) {
      searchParams.append('lastKey', params.lastKey)
    }

    if (params.search) {
      searchParams.append('search', params.search)
    }

    return this.makeRequest<SendersListResponse>(`/senders?${searchParams.toString()}`)
  }

  async getOne(id: string): Promise<Sender> {
    return this.makeRequest<Sender>(`/senders/${id}`)
  }

  async create(data: CreateSenderRequest): Promise<Sender> {
    return this.makeRequest<Sender>(`/senders`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async update(id: string, data: UpdateSenderRequest): Promise<Sender> {
    return this.makeRequest<Sender>(`/senders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async delete(id: string): Promise<void> {
    await this.makeRequest<void>(`/senders/${id}`, {
      method: "DELETE",
    })
  }
}

export const sendersApi = new SendersApiService()