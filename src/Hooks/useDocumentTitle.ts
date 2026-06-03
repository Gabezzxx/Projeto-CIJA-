import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);
}