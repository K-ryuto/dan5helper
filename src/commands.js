/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */

export const AWW_COMMAND = {
  name: 'shop-view',
  description: 'shopの内容を見ることができます。',
  options: [
    {
      type: 3,
      name: "id",
      required: true,
      description:"idをここに入力(0～)"
    },
    {
      type: 3,
      name: "token",
      required: false,
      description:"tokenをここに入力"
    }
  ]
};
export const ADD_ACOUNT = {
  name: 'アカウントの登録',
  description: 'アカウントの登録を行います',
  options: [
    {
      type: 3,
      name: "mcid",
      required: true,
      description:"mcidをここに入力(uuidの取得に使います)"
    },
    {
      type: 3,
      name: "token",
      required: true,
      description:"tokenをここに入力"
    }
  ]
};

export const NETWORTH = {
  name: 'networth',
  description: 'shopの情報を出します。',
  options: [
    {
      type: 3,
      name: "token",
      required: false,
      description:"tokenをここに入力"
    },
    {
      type: 3,
      name: "カテゴリー",
      required: false,
      description:"カテゴリーをここに入力"
    }
  ]
};

export const INVITE_COMMAND = {
  name: 'invite',
  description: 'Get an invite link to add the bot to your server',
};
