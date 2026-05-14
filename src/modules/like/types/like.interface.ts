export enum LikeTargetType {
  POST = 'post',
  COMMENT = 'comment',
}

export type LikeTargetResult = {
  entityId: number;
  entityType: LikeTargetType;

  receiverId: number;

  textPreview?: string;

  imagePreview?: string;
};
