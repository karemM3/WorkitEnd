import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  path: string,
  data?: unknown | undefined,
  isFormData: boolean = false,
): Promise<any> {
  let headers = {};
  let body = undefined;

  // For debugging
  console.log(`API Request: ${method} ${path}`);
  if (data) {
    console.log('Request payload:', data);
  }

  if (data) {
    if (isFormData) {
      body = data as FormData;
    } else {
      headers = { "Content-Type": "application/json" };
      body = JSON.stringify(data);
    }
  }

  try {
    const fullPath = path.startsWith('/api') ? path : `/api${path}`;
    console.log(`Sending request to: ${fullPath}`);
    
    const response = await fetch(fullPath, {
      method,
      headers,
      body,
      credentials: "include",
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
      console.log('Response data:', responseData);
    } else {
      const text = await response.text();
      console.log('Response text:', text);
      try {
        // Try to parse as JSON anyway
        responseData = JSON.parse(text);
      } catch (e) {
        // If it's not JSON, just use the text
        responseData = { message: text };
      }
    }

    if (!response.ok) {
      const error = new Error(responseData.message || 'API request failed');
      (error as any).status = response.status;
      (error as any).data = responseData;
      throw error;
    }

    return responseData;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}


type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});