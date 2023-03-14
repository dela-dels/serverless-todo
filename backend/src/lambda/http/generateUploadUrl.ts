import "source-map-support/register";

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as middy from "middy";
import { cors, httpErrorHandler } from "middy/middlewares";
import * as uuid from "uuid";
import { getUserId } from "../utils";
import {
  generateUploadUrl,
  updateAttachmentUrl,
} from "../../dataAccess/attachmentUtils";

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;
    const userId = getUserId(event);
    const attachmentId = uuid.v4();

    const url = await generateUploadUrl(attachmentId);
    await updateAttachmentUrl(userId, todoId, attachmentId);

    return {
      isBase64Encoded: true,
      statusCode: 200,
      body: JSON.stringify({
        url,
      }),
    };
  }
);

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true,
  })
);
