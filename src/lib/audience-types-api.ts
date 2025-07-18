export interface AudienceType {
  id: string
  name: string
  createDate: string
  createUser: string
  modifyDate: string
  modifyUser: string
}

export interface AudienceTypesListResponse {
  results: AudienceType[]
  lastEvaluatedKey?: string
}

export interface AudienceTypesListParams {
  limit: number
  lastKey?: string
  search?: string
}

export interface CreateAudienceTypeRequest {
  name: string
  user: string
}

export interface UpdateAudienceTypeRequest {
  name: string
  user: string
}

class AudienceTypesApiService {
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

  async list(params: AudienceTypesListParams): Promise<AudienceTypesListResponse> {
    const searchParams = new URLSearchParams({
      limit: params.limit.toString(),
    })

    if (params.lastKey) {
      searchParams.append('lastKey', params.lastKey)
    }

    if (params.search) {
      searchParams.append('search', params.search)
    }

    return this.makeRequest<AudienceTypesListResponse>(`/audiencetype?${searchParams.toString()}`)
  }

  async getOne(id: string): Promise<AudienceType> {
    return this.makeRequest<AudienceType>(`/audiencetype/${id}`)
  }

  async create(data: CreateAudienceTypeRequest): Promise<AudienceType> {
    return this.makeRequest<AudienceType>(`/audiencetype`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async update(id: string, data: UpdateAudienceTypeRequest): Promise<AudienceType> {
    return this.makeRequest<AudienceType>(`/audiencetype/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async delete(id: string): Promise<void> {
    await this.makeRequest<void>(`/audiencetype/${id}`, {
      method: "DELETE",
    })
  }
}

export const audienceTypesApi = new AudienceTypesApiService()