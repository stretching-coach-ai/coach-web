import { bodyPartMap } from './bodyPartMap';

export const getBodyPartName = (pathId: string) => {
  return bodyPartMap[pathId] || null;
};
