import * as AWS from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk";
import { createLogger } from "../utils/logger";
import { TodosAccess } from "./todosAccess";
const logger = createLogger("todo-access");

const XAWS = AWSXRay.captureAWS(AWS);

export class TodosStorage {
  constructor(
    private readonly s3 = new XAWS.S3({ signatureVersion: "v4" }),
    private readonly bucket = process.env.ATTACHMENT_S3_BUCKET,
    private readonly urlExpirationTime = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async getAttachmentUrl(attachmentId: string): Promise<string> {
    const attachmentUrl = `https://${this.bucket}.s3.amazonaws.com/${attachmentId}`;
    return attachmentUrl;
  }

  async getUploadUrl(attachmentId: string): Promise<string> {
    const url = this.s3.getSignedUrl("putObject", {
      Bucket: this.bucket,
      Key: attachmentId,
      Expires: parseInt(this.urlExpirationTime),
    });
    return url;
  }
}

/**
 * create instance of TodoStorage
 */
const todosStorage = new TodosStorage();

/**
 * create instance of TodoAccess
 */
const todosAccess = new TodosAccess();

export async function updateAttachmentUrl(
  userId: string,
  todoId: string,
  attachmentId: string
) {
  logger.info(
    `Generating attachment URL for attachment with id: ${attachmentId}, todoId: ${todoId}`
  );

  const url = await todosStorage.getAttachmentUrl(attachmentId);

  logger.info(`Updating todo attachment`, {
    userId,
    todoId,
  });

  const item = await todosAccess.getTodoItem(todoId);

  if (!item) throw new Error("Todo item not found");

  if (item.userId !== userId) {
    logger.error(
      `User does not have the right permission(s) to update todo with id: ${todoId}`
    );
    throw new Error("User is not authorized to perform action");
  }

  await todosAccess.updateAttachmentUrl(todoId, url);
}

export async function generateUploadUrl(attachmentId: string): Promise<string> {
  logger.info(`Generating upload URL for attachment with id: ${attachmentId}`);

  const url = await todosStorage.getUploadUrl(attachmentId);

  return url;
}
