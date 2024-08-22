import { useRouteError } from "react-router-dom";
import logger from "../lib/logger";

export default function ErrorPage() {
  const error: any = useRouteError();
  logger.error(error);

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occured</p>
      <p>
        <i>{error}</i>
      </p>
    </div>
  );
}
