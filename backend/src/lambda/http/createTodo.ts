import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import "source-map-support/register";
import * as middy from "middy";
import { cors, httpErrorHandler } from "middy/middlewares";
import { CreateTodoRequest } from "../../requests/CreateTodoRequest";
import { getUserId } from "../utils";
import { createTodo } from "../../businessLogic/todos";
import { createLogger } from "../../utils/logger";

const logger = createLogger("createTodos");

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info("createTodo event", { event });

    const todo: CreateTodoRequest = JSON.parse(event.body);

    const userId = getUserId(event);

    const createdTodo = await createTodo(todo, userId);

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: createdTodo,
      }),
    };
  }
);

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true,
  })
);
