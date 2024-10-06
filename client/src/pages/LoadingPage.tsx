import LoadingIcon from "../components/Loading/LoadingIcon";
import Page from "../components/ui/Page";

export default function LoadingPage() {
  return (
    <Page id="loading-page" className="grid place-items-center" noAnimation>
      <LoadingIcon className="aspect-square w-64" />
    </Page>
  );
}
