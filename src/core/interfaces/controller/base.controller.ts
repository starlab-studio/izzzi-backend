export interface Response<T> {
  success: boolean;
  data?: T;
  errors?: { message: string; context?: Record<string, any> }[];
}

export abstract class BaseController {
  protected success<T>(data: T): Response<T> {
    return { success: true, data };
  }

  protected successPaginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): Response<{
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return {
      success: true,
      data: {
        items: data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }
}
