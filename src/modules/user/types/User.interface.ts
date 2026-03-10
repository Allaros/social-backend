import { ProfileResponce } from '@app/modules/profile/types/profile.interface';

export interface UserResponse {
  id: number;
  email: string;
  isVerified: boolean;
  profile: ProfileResponce | null;
}
