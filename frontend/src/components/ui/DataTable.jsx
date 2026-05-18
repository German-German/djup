const DataTable = ({ data, columns, loading }) => {
  if (loading) {
    return (
      <div className="w-full h-32 flex items-center justify-center">
        <div className="w-5 h-5 border border-[var(--djup-border-strong)] border-t-[var(--djup-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-32 flex items-center justify-center djup-section-label">
        No records in current universe
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.cell
                    ? col.cell({
                        getValue: () => row[col.accessorKey],
                        row: row,
                      })
                    : row[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
