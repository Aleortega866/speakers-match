import { redirect } from "next/navigation";

/**
 * La referencia se divide en vistas independientes; la raíz redirige al cuestionario.
 */
export default function AdminReferenciaIndexPage() {
  redirect("/admin/referencia/cuestionario");
}
