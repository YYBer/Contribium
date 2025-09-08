const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-react')

const options = {
  definition: {
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
            reward_amount: { type: 'number' },
            reward_currency: { type: 'string', enum: ['ALPH', 'USD'] },
            status: { type: 'string', enum: ['open', 'completed', 'closed'] },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            category: { type: 'string' },
            skills_required: { type: 'array', items: { type: 'string' } },
            deadline: { type: 'string', format: 'date-time' },
            sponsor_id: { type: 'string', format: 'uuid' },
            current_submissions: { type: 'integer', minimum: 0 },
            max_submissions: { type: 'integer', minimum: 1 },
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
            solution_url: { type: 'string', format: 'uri' },
            status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
            feedback: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            user_id: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            error: { type: 'string' }
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
          bearerFormat: 'JWT'
        }
      }
    },
    paths: {
      '/rest/v1/bounties': {
        get: {
          summary: 'List all bounties',
          description: 'Retrieve a list of all bounties with optional filtering',
          tags: ['Bounties'],
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
              name: 'difficulty',
              in: 'query',
              description: 'Filter by difficulty level',
              schema: {
                type: 'string',
                enum: ['beginner', 'intermediate', 'advanced']
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
            }
          }
        },
        post: {
          summary: 'Create a new bounty',
          description: 'Create a new bounty (requires authentication)',
          tags: ['Bounties'],
          security: [{ BearerAuth: [] }],
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
          security: [{ BearerAuth: [] }],
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
          parameters: [
            {
              name: 'bounty_id',
              in: 'query',
              required: true,
              description: 'Bounty ID to get submissions for',
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
          security: [{ BearerAuth: [] }],
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
          summary: 'Get current user',
          description: 'Retrieve current authenticated user information',
          tags: ['Users'],
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: 'Successful response',
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
        },
        patch: {
          summary: 'Update user profile',
          description: 'Update current user profile information',
          tags: ['Users'],
          security: [{ BearerAuth: [] }],
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
      '/rest/v1/projects': {
        get: {
          summary: 'List projects',
          description: 'Retrieve a list of all projects',
          tags: ['Projects'],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Project' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create project',
          description: 'Create a new project (requires authentication)',
          tags: ['Projects'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Project'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Project created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Project' }
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
  },
  apis: ['./src/services/*.ts']
}

const swaggerSpec = swaggerJSDoc(options)
module.exports = { swaggerSpec, swaggerUi }