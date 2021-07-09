import { atom } from "recoil";

export const defaultFormState = {
  name: "",
  email: "",
  subject: "",
  body: "",
};

export const formState = atom({
  key: "contact.formState",
  default: defaultFormState,
});

export const defaultMessagesState = [];

export const messagesState = atom({
  key: "contact.messagesState",
  default: defaultMessagesState,
});

export const defaultLoadingState = false;

export const loadingState = atom({
  key: "contact.loadingState",
  default: defaultLoadingState,
});
