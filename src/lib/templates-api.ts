export interface Template {
  id: string
  name: string
  local: string
  audienceTypeId: string
  emailType: 'campaign' | 'automation' | 'functional'
  header: string
  footer: string
  unsubscribe?: string
  previousStatus: string
  status: 'draft' | 'published' | 'archived'
  createDate: string
  createUser: string
  modifyDate: string
  modifyUser: string
}

export interface TemplateListResponse {
  results: Template[]
  lastEvaluatedKey?: string
}

export interface TemplateListParams {
  limit: number
  lastKey?: string
  search?: string
}

export interface CreateTemplateRequest {
  name?: string
  local?: string
  audienceTypeId?: string
  emailType?: 'campaign' | 'automation' | 'functional'
  header?: string
  footer?: string
  unsubscribe?: string
  status?: 'draft' | 'published' | 'archived'
  user: string
}

export interface UpdateTemplateRequest {
  name?: string
  local?: string
  audienceTypeId?: string
  emailType?: 'campaign' | 'automation' | 'functional'
  header?: string
  footer?: string
  unsubscribe?: string
  status?: 'draft' | 'published' | 'archived'
  user: string
}

export interface ArchiveTemplateRequest {
  user: string
}

class TemplatesApiService {
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

  async list(params: TemplateListParams): Promise<TemplateListResponse> {
    const searchParams = new URLSearchParams({
      limit: params.limit.toString(),
    })

    if (params.lastKey) {
      searchParams.append('lastKey', params.lastKey)
    }

    if (params.search) {
      searchParams.append('search', params.search)
    }

    return this.makeRequest<TemplateListResponse>(`/template?${searchParams.toString()}`)
  }

  async getOne(id: string): Promise<Template> {
    return this.makeRequest<Template>(`/template/${id}`)
  }

  async create(data: CreateTemplateRequest): Promise<Template> {
    return this.makeRequest<Template>(`/template`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async update(id: string, data: UpdateTemplateRequest): Promise<Template> {
    return this.makeRequest<Template>(`/template/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async delete(id: string): Promise<void> {
    await this.makeRequest<void>(`/template/${id}`, {
      method: "DELETE",
    })
  }

  async duplicate(id: string): Promise<Template> {
    return this.makeRequest<Template>(`/template/${id}`, {
      method: "POST",
    })
  }

  async archive(id: string, data: ArchiveTemplateRequest): Promise<Template> {
    return this.makeRequest<Template>(`/template/archive`, {
      method: "PUT",
      body: JSON.stringify({ ...data, id }),
    })
  }
}

export const templatesApi = new TemplatesApiService()