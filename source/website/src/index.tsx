// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ReactDOM from "react-dom/client";
import App from "./App";
import { Amplify } from "aws-amplify";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.scss";
import { Provider } from "react-redux";
import { setupStore } from "./app/store";
import { getRuntimeConfig } from "./utils/apiHelper";

const json = getRuntimeConfig().then(json => {
    const awsconfig = {
        Auth: {
            region: json.AWS_REGION,
            userPoolId: json.USER_POOL_ID,
            userPoolWebClientId: json.USER_POOL_CLIENT_ID
        },
        Storage: {
            AWSS3: {
                region: json.AWS_REGION
            }
        },
        API: {
            endpoints: [
                {
                    name: "supply-chain-simulator-on-aws-api",
                    endpoint: json.API_ENDPOINT,
                    region: json.AWS_REGION
                }
            ]
        }
    };

    Amplify.configure(awsconfig);

    const store = setupStore();
    const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
    root.render(
        <Provider store={store}>
            <App />
        </Provider>
    );
});
