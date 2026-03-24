export const getStudentId = (row: any) => {
  if (!row) return null;
  const norm: Record<string, any> = {};
  Object.keys(row).forEach(k => {
    norm[k.trim().toLowerCase().replace(/\s+/g, '')] = row[k];
  });
  return (norm["studentid"] || norm["id"])?.toString();
};

export const getIsCR = (row: any) => {
  if (!row) return false;
  const norm: Record<string, any> = {};
  Object.keys(row).forEach(k => {
    norm[k.trim().toLowerCase().replace(/\s+/g, '')] = row[k];
  });
  return (
    String(norm["iscr"] || norm["is_cr"] || norm["role"]).toUpperCase() === "TRUE" || 
    String(norm["role"]).toUpperCase() === "CR" || 
    String(norm["cr"]).toUpperCase() === "Y"
  );
};
