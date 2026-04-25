import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { RemovalPolicy, Duration } from "aws-cdk-lib";
import * as path from "path";
import * as fs from "fs";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";

export type StaticSiteStackProps = cdk.StackProps;

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StaticSiteStackProps) {
    super(scope, id, props);

    const websiteBucket = new Bucket(this, "WebsiteBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [websiteBucket.arnForObjects("*")],
        principals: [new iam.AnyPrincipal()],
      })
    );

    const distribution = new Distribution(this, "WebsiteDistribution", {
      defaultBehavior: {
        origin: S3BucketOrigin.withBucketDefaults(websiteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(0),
        },
      ],
    });

    const projectRoot = path.resolve(__dirname, "..", "..");
    const distPath = path.join(projectRoot, "dist");

    if (!fs.existsSync(distPath) || fs.readdirSync(distPath).length === 0) {
      throw new Error(
        `Build output directory is empty or does not exist: ${distPath}`
      );
    }

    new BucketDeployment(this, "DeploySite", {
      sources: [Source.asset(distPath, { exclude: [] })],
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
