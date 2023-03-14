import { TodosAccess } from "../dataAccess/todosAccess";
import { TodoItem } from "../models/TodoItem";
import { TodoUpdate } from "../models/TodoUpdate";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { createLogger } from "../utils/logger";
import * as uuid from "uuid";

const logger = createLogger("todos");
const todoAccess = new TodosAccess();

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  logger.info(`Get all todos for user with id ${userId}`);
  return todoAccess.getAllTodos(userId);
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const todoId = uuid.v4();

  const todo: TodoItem = {
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: null,
    ...createTodoRequest,
  };

  logger.info(`Creating todo with id: ${todoId} for user with id: ${userId}`, {
    userId,
    todoId,
    todoItem: todo,
  });

  await todoAccess.createTodo(todo);

  return todo;
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
) {
  logger.info(`Updating todo with the following details`, {
    userId,
    todoId,
    todoUpdate: updateTodoRequest,
  });

  const todo = await todoAccess.getTodoItem(todoId);

  if (!todo) throw new Error("todo item not found");

  if (todo.userId !== userId) {
    logger.error(`User does not have the permission(s) to update todo`);
    throw new Error("User is not authorized to perform this action");
  }

  todoAccess.updateTodoItem(todoId, updateTodoRequest as TodoUpdate);
}

export async function deleteTodo(userId: string, todoId: string) {
  logger.info(`Deleting todo with the following details:`, { userId, todoId });

  const todo = await todoAccess.getTodoItem(todoId);

  if (!todo) throw new Error("Item not found");

  if (todo.userId !== userId) {
    logger.error(`User  does not have the permission(s) to delete todo item`);
    throw new Error("User is not authorized to perform this action");
  }

  todoAccess.deleteTodoItem(todoId);
}
