import * as cdk from "aws-cdk-lib";
import { StaticSite } from "./bucket";

class MyStaticSiteStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string) {
    super(parent, name);
    new StaticSite(this, "ShopCosmeticsStaticWebsite");
  }
}

const app = new cdk.App();
new MyStaticSiteStack(app, "ShopCosmeticsApp");
app.synth();
