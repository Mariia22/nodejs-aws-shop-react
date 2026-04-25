import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { RemovalPolicy, Duration } from "aws-cdk-lib";
import * as path from "path";
import {
  Distribution,
  CfnOriginAccessControl,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";

export type StaticSiteStackProps = cdk.StackProps;

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StaticSiteStackProps) {
    super(scope, id, props);

    const websiteBucket = new Bucket(this, "WebsiteBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const originAccessControl = new CfnOriginAccessControl(this, "WebsiteOAC", {
      originAccessControlConfig: {
        name: "WebsiteOAC",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    });

    const distribution = new Distribution(this, "WebsiteDistribution", {
      defaultBehavior: {
        origin: {
          domainName: websiteBucket.bucketRegionalDomainName,
          originAccessControl: originAccessControl,
          originPath: "",
          originId: "S3Origin",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(0),
        },
      ],
    });

    websiteBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ["s3:GetObject"],
        principals: [
          new cdk.aws_iam.ServicePrincipal("cloudfront.amazonaws.com"),
        ],
        resources: [websiteBucket.arnForObjects("*")],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::${
              cdk.Stack.of(this).account
            }:distribution/${distribution.distributionId}`,
          },
        },
      })
    );

    const distPath = path.join(__dirname, "..", "..", "dist");
    new BucketDeployment(this, "DeploySite", {
      sources: [Source.asset(distPath)],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "WebsiteURL", {
      value: distribution.distributionDomainName,
      description: "CloudFront distribution domain",
    });
  }
}
