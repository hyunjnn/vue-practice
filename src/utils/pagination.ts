interface PageIndices {
  startIndex: number;
  endIndex: number;
}

const calculatePageIndices = (currentPage: number, itemsPerPage: number): PageIndices => {
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = currentPage * itemsPerPage;
  return { startIndex, endIndex };
};

export { calculatePageIndices };
