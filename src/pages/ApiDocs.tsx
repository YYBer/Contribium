import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"

// Import the swagger specification
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Contribium API',
    version: '1.0.0',
    description: 'API documentation for Contribium bounty platform services',
    contact: {
      name: 'Contribium Team',
      url: 'https://contribium.alephium.org'
    }
  },
  servers: [
    {
      url: 'https://wawxluhjdnqewiaexvvk.supabase.co',
      description: 'Supabase Backend'
    }
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          username: { type: 'string' },
          full_name: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          avatar_url: { type: 'string', format: 'uri' },
          github_url: { type: 'string', format: 'uri' },
          twitter_url: { type: 'string', format: 'uri' },
          wallet_address: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Bounty: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          requirements: { type: 'string' },
          reward: { 
            type: 'object',
            properties: {
              amount: { type: 'number' },
              token: { type: 'string' },
              usd_equivalent: { type: 'number' }
            }
          },
          status: { type: 'string', enum: ['open', 'completed', 'closed'] },
          difficulty_level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
          category: { type: 'string' },
          max_submissions: { type: 'integer', minimum: 1 },
          current_submissions: { type: 'integer', minimum: 0 },
          deadline: { type: 'string', format: 'date-time' },
          sponsor_id: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      BountySubmission: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          bounty_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          submission_url: { type: 'string', format: 'uri' },
          status: { type: 'string', enum: ['submitted', 'accepted', 'rejected'] },
          feedback: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Sponsor: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          logo_url: { type: 'string', format: 'uri' },
          website_url: { type: 'string', format: 'uri' },
          is_verified: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'integer' }
        }
      }
    },
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from Supabase Auth'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'apikey',
        description: 'Supabase API Key (required for all requests)'
      }
    }
  },
  paths: {
    '/rest/v1/bounties': {
      get: {
        summary: 'List all bounties',
        description: 'Retrieve a list of all bounties with optional filtering',
        tags: ['Bounties'],
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filter by bounty status',
            schema: {
              type: 'string',
              enum: ['open', 'completed', 'closed']
            }
          },
          {
            name: 'difficulty_level',
            in: 'query',
            description: 'Filter by difficulty level',
            schema: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced']
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Limit number of results',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Bounty' }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'No API key found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new bounty',
        description: 'Create a new bounty (requires authentication)',
        tags: ['Bounties'],
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Bounty'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Bounty created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Bounty' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/rest/v1/bounties/{id}': {
      get: {
        summary: 'Get bounty by ID',
        description: 'Retrieve a specific bounty with its submissions',
        tags: ['Bounties'],
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Bounty ID',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Bounty' }
              }
            }
          },
          '404': {
            description: 'Bounty not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      patch: {
        summary: 'Update bounty',
        description: 'Update an existing bounty (requires authentication)',
        tags: ['Bounties'],
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Bounty ID',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Bounty'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Bounty updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Bounty' }
              }
            }
          },
          '404': {
            description: 'Bounty not found'
          }
        }
      }
    },
    '/rest/v1/bounty_submissions': {
      get: {
        summary: 'List bounty submissions',
        description: 'Retrieve submissions for a specific bounty',
        tags: ['Submissions'],
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: 'bounty_id',
            in: 'query',
            required: false,
            description: 'Filter by bounty ID',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          },
          {
            name: 'user_id',
            in: 'query',
            required: false,
            description: 'Filter by user ID',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/BountySubmission' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Submit solution to bounty',
        description: 'Submit a solution to a bounty (requires authentication)',
        tags: ['Submissions'],
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BountySubmission'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Submission created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BountySubmission' }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/rest/v1/users': {
      get: {
        summary: 'List users',
        description: 'Retrieve user profiles (public information)',
        tags: ['Users'],
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: 'username',
            in: 'query',
            description: 'Filter by username',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      patch: {
        summary: 'Update user profile',
        description: 'Update current user profile information',
        tags: ['Users'],
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/rest/v1/sponsors': {
      get: {
        summary: 'List sponsors',
        description: 'Retrieve a list of all sponsors',
        tags: ['Sponsors'],
        security: [{ ApiKeyAuth: [] }],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Sponsor' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create sponsor',
        description: 'Create a new sponsor organization (requires authentication)',
        tags: ['Sponsors'],
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Sponsor'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Sponsor created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Sponsor' }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    }
  }
}

const ApiDocs: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-theme-primary mb-4">
          API Documentation
        </h1>
        <p className="text-lg text-theme-secondary mb-4">
          Complete API documentation for the Contribium bounty platform
        </p>
        <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              API Base URL
            </h3>
            <p className="text-blue-800 dark:text-blue-200 mb-3">
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                https://wawxluhjdnqewiaexvvk.supabase.co/rest/v1/
              </code>
            </p>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Authentication Required
            </h3>
            <p className="text-blue-800 dark:text-blue-200">
              All API endpoints require the Supabase API key in the <code>apikey</code> header.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">GET</Badge>
              /bounties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-theme-secondary">List all bounties with optional filtering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">POST</Badge>
              /bounties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-theme-secondary">Create a new bounty (requires authentication)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">GET</Badge>
              /bounty_submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-theme-secondary">List bounty submissions for a specific bounty</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">POST</Badge>
              /bounty_submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-theme-secondary">Submit a solution to a bounty (requires authentication)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ApiDocs