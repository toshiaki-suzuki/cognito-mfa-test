import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class CognitoMfaTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // VPC =========================================================
    const vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: 'cognito-mfa-test-vpc',
      maxAzs: 2,
      cidr: '10.0.0.0/16',
    });

    // ALB =========================================================
    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('Listener', {
      port: 80,
      open: true,
    });

   // ダミーターゲットの作成
    const dummyTarget = new elbv2.ApplicationTargetGroup(this, 'DummyTarget', {
      vpc,
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 80,
    });
    listener.addTargetGroups('DummyTargetGroup', {
      targetGroups: [dummyTarget],
    });


    // Cognito =========================================================
    const userpool = new cognito.UserPool(this, 'mfaTestUserPool', {
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

    const client = userpool.addClient('mfa-test-app-client', {
      // アプリケーションクライアント名
      userPoolClientName: 'mfa-test-app-client',
      // クライアントシークレットを生成するかどうか
      generateSecret: false,
      // クライアントが使用する認証フロー
      authFlows: {
        adminUserPassword: false,
        custom: true,
        userPassword: false,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
        ],
        callbackUrls: [
          `https://${alb.loadBalancerDnsName}/auth2/idpresponse`
        ],
        logoutUrls: [
          `https://${alb.loadBalancerDnsName}/dummy`
        ],
      },
    });
  }
}
