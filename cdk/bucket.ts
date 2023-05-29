import { Construct } from "constructs";
import { Stack } from "aws-cdk-lib/core";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as deployment from "aws-cdk-lib/aws-s3-deployment";

export class StaticSite extends Construct {
  constructor(parent: Stack, name: string) {
    super(parent, name);

    const cloudfrountOAI = new cf.OriginAccessIdentity(
      this,
      "ShopCosmetics-OAI"
    );

    const bucket = new s3.Bucket(this, "ShopCosmeticsBucket", {
      bucketName: "shop-cosmetics-bucket",
      websiteIndexDocument: "index.html",
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["S3:GetObject"],
        resources: [bucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrountOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          )
        ]
      })
    );

    const distribution = new cf.CloudFrontWebDistribution(
      this,
      "ShopCosmetics-Dist",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: bucket,
              originAccessIdentity: cloudfrountOAI
            },
            behaviors: [
              {
                isDefaultBehavior: true
              }
            ]
          }
        ]
      }
    );

    new deployment.BucketDeployment(this, "ShopCosmetics-Bucket-Deployment", {
      sources: [deployment.Source.asset("./dist")],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"]
    });
  }
}
