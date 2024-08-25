import { useRouteError } from "react-router-dom";
import logger from "../lib/logger";
import Page from "../components/ui/Page";

export default function ErrorPage() {
  const error: any = useRouteError();
  console.log(error);

  return (
    <Page id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occured</p>
      <p>{/* <i>{error}</i> */}</p>
    </Page>
  );
}
