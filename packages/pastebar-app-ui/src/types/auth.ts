export type SignInCredential = {
  userName: string
  password: string
}

export type SignInResponse = {
  token: string
  user: {
    userName: string
    authority: string[]
    avatar: string
    email: string
  }
}

export type SignUpResponse = SignInResponse

export type SignUpCredential = {
  userName: string
  email: string
  password: string
}

export type ForgotPassword = {
  email: string
}

export type ResetPassword = {
  password: string
}
