import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class CognitoMfaTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new cognito.UserPool(this, 'mfaTestUserPool', {
      userPoolName: 'mfa-test-userpool',
      // パスワードポリシー
      passwordPolicy: {
        // ４種８桁を定義
          minLength: 8,
          requireLowercase: true,
          requireDigits: true,
          requireUppercase: false,
          requireSymbols: false,
          tempPasswordValidity: cdk.Duration.days(7), // 仮パスワードの有効期限
      },
      // 自分でサインアップすることを許可するかどうか
      selfSignUpEnabled: true,
      // 必須の標準属性やカスタム属性
      standardAttributes: {
        email: {
          required: true,
          mutable: true // 後に値を変更することを許可する
        },
        fullname: {
          required: true,
          mutable: true
        },
      },
      // Cognitoがユーザーのサインアップ時に自動的に確認するために調べる属性
      autoVerify: {
        email: true
      },
      // ユーザーがユーザープールに登録またはサインインする方法
      signInAliases: {
        email: true,
        username: true
      },
      // サインインエイリアスを大文字と小文字を区別して評価するかどうか
      signInCaseSensitive: true,
      // ユーザーは自分のアカウントをどのように回復できるか
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      // emailの設定
      // emailSettings: {
      //   from: '',
      //   replyTo: ''
      // },
      // 認証メール設定
      userVerification: {
        emailSubject: 'Your verification code',
        emailBody: 'Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      // MFAの設定
      mfa: cognito.Mfa.REQUIRED,
      // 使用可能なMFAの種類を指定
      mfaSecondFactor: {
        sms: true,
        otp: true
      },
    });
  }
}
