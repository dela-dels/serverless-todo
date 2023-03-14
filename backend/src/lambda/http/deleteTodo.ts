import "source-map-support/register";

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as middy from "middy";
import { cors, httpErrorHandler } from "middy/middlewares";
import { deleteTodo } from "../../businessLogic/todos";
import { getUserId } from "../utils";
import { createLogger } from "../../utils/logger";

const logger = createLogger("deleteTodos");

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info("performing delete operation for todo", {
      todoId: event.pathParameters.todoId,
    });

    const userId = getUserId(event);
    const todoId = event.pathParameters.todoId;

    await deleteTodo(userId, todoId);
    return {
      statusCode: 204,
      body: "",
    };
  }
);

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true,
  })
);

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true,
  })
);
