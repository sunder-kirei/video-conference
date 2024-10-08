import { useRouteError } from "react-router-dom";
import Page from "../components/ui/Page";

export default function ErrorPage() {
  const error: unknown = useRouteError();
  console.error(error);
  return (
    <Page id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occured</p>
    </Page>
  );
}
