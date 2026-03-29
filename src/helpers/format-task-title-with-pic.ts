/**
 * Gabungan judul proyek/tugas (`name`) dengan nama PIC (`shortName`), untuk teks batang & daftar.
 */
export function formatTaskTitleWithPic(name: string, picShort?: string): string {
  const pic = picShort?.trim();
  return pic ? `${name} · ${pic}` : name;
}
