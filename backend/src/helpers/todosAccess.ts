import * as AWS from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk')
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

export class TodosAccess {
  constructor(
    private readonly dynamoDbClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosByUserIndex = process.env.TODOS_CREATED_AT_INDEX
  ) {}

  async todoItemExists(todoId: string): Promise<boolean> {
    const item = await this.getTodoItem(todoId)
    return !!item
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all Todos From Storage')

    const result = await this.dynamoDbClient
      .query({
        TableName: this.todosTable,
        IndexName: this.todosByUserIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    logger.info(`Creating new todo with name: ${todo.name} `)

    await this.dynamoDbClient
      .put({
        TableName: this.todosTable,
        Item: todo
      })
      .promise()

    return todo
  }

  async getTodoItem(todoId: string): Promise<TodoItem> {
    logger.info(`Getting single todo item with id: ${todoId} `)

    const result = await this.dynamoDbClient
      .get({
        TableName: this.todosTable,
        Key: {
          todoId
        }
      })
      .promise()

    const item = result.Item

    return item as TodoItem
  }

  async updateTodoItem(todoId: string, todoUpdate: TodoUpdate) {
    logger.info(`Updating todo item with id: ${todoId}`)

    await this.dynamoDbClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId
        },
        UpdateExpression: 'set dueDate = :dueDate, done = :done, #name = :name',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': todoUpdate.name,
          ':dueDate': todoUpdate.dueDate,
          ':done': todoUpdate.done
        }
      })
      .promise()
  }

  async deleteTodoItem(todoId: string) {
    logger.info(`Deleting todo item with id: ${todoId}`)

    await this.dynamoDbClient
      .delete({
        TableName: this.todosTable,
        Key: {
          todoId
        }
      })
      .promise()
  }

  async updateAttachmentUrl(todoId: string, attachmentUrl: string) {
    logger.info(
      `Updating attachment URL for todo with id: ${todoId} and attachment url: ${attachmentUrl}`
    )

    await this.dynamoDbClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId
        },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        }
      })
      .promise()
  }
}
