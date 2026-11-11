import type { FormikProps } from "formik";
import type { SetStateAction } from "react";

/**
 * `const f = fieldOf(form); const [name, setName] = f("name");` gives a Formik field the shape of a useState pair
 * (setter accepts an updater), so big forms can move onto Formik without rewriting every handler.
 * shortcut: the updater runs against the render's value, so two updates to the same field in one event overwrite each other; upgrade: use setFieldValue with the new value directly.
 */
export const fieldOf = <V extends object>(form: FormikProps<V>) => <K extends keyof V & string>(k: K) => [
  form.values[k],
  (v: SetStateAction<V[K]>) => { void form.setFieldValue(k, typeof v === "function" ? (v as (p: V[K]) => V[K])(form.values[k]) : v, false); },
] as const;
