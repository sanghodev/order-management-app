import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTable, useSortBy } from 'react-table';
import styles from '../styles/Table.module.css';

export default function Complete({ socket }) {
  const [orders, setOrders] = useState([]);
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('complete'); // 'complete' or 'delete'

  const fetchCompletedOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/orders?status=Complete');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch completed orders:', error.message);
    }
  }, []);

  const fetchDeletedOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/orders?status=Deleted');
      setDeletedOrders(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch deleted orders:', error.message);
    }
  }, []);

  useEffect(() => {
    fetchCompletedOrders();
    fetchDeletedOrders();

    if (socket) {
      const handleOrderUpdated = (updatedOrder) => {
        if (updatedOrder.status === 'Complete') {
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order._id === updatedOrder._id ? updatedOrder : order
            )
          );
        } else {
          setOrders((prevOrders) => prevOrders.filter((order) => order._id !== updatedOrder._id));
        }
      };

      const handleOrderDeleted = (deletedOrder) => {
        setDeletedOrders((prevDeletedOrders) => [...prevDeletedOrders, deletedOrder]);
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== deletedOrder._id)
        );
      };

      socket.on('orderUpdated', handleOrderUpdated);
      socket.on('orderDeleted', handleOrderDeleted);

      return () => {
        socket.off('orderUpdated', handleOrderUpdated);
        socket.off('orderDeleted', handleOrderDeleted);
      };
    }
  }, [socket, fetchCompletedOrders, fetchDeletedOrders]);

  const rollbackOrder = useCallback(async (id) => {
    try {
      const res = await axios.put(`/api/orders/${id}/rollback`);
      const updatedOrder = res.data.data;
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order._id !== updatedOrder._id)
      );
      if (socket) {
        socket.emit('orderUpdated', updatedOrder);
      }
    } catch (error) {
      console.error('Failed to rollback order:', error.message);
      fetchCompletedOrders(); // If rollback fails, re-fetch the orders to reset the state
    }
  }, [socket, fetchCompletedOrders]);

  const deleteOrder = useCallback(async (id) => {
    try {
      const res = await axios.put(`/api/orders/${id}`, { status: 'Deleted' });
      const deletedOrder = res.data.data;
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order._id !== id)
      );
      setDeletedOrders((prevDeletedOrders) => [...prevDeletedOrders, deletedOrder]);
      if (socket) {
        socket.emit('orderDeleted', deletedOrder);
      }
    } catch (error) {
      console.error('Failed to delete order:', error.message);
    }
  }, [socket]);

  const data = React.useMemo(() => orders, [orders]);
  const deletedData = React.useMemo(() => deletedOrders, [deletedOrders]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Sales Rep',
        accessor: 'salesRep',
      },
      {
        Header: 'Customer Account',
        accessor: 'customerAccount',
        sortType: 'alphanumeric', // Sort type for alphanumeric
      },
      {
        Header: 'Design Proof',
        accessor: 'designProof',
        Cell: ({ value }) => (value ? 'Yes' : 'No'),
      },
      {
        Header: 'Silkprint Film',
        accessor: 'silkprintFilm',
        Cell: ({ value }) => (value ? 'Yes' : 'No'),
      },
      {
        Header: 'Embroidery',
        accessor: 'embroidery',
        Cell: ({ value }) => (value ? 'Yes' : 'No'),
      },
      {
        Header: 'Decal',
        accessor: 'decal',
      },
      {
        Header: 'DTF',
        accessor: 'dtf',
      },
      {
        Header: 'Medal',
        accessor: 'medal',
      },
      {
        Header: 'Trophy',
        accessor: 'trophy',
      },
      {
        Header: 'Pickup Date',
        accessor: 'pickupDate',
        sortType: (a, b) => {
          // Custom sort type for date
          const dateA = new Date(a.original.pickupDate);
          const dateB = new Date(b.original.pickupDate);
          return dateA - dateB;
        },
      },
      {
        Header: 'Notes',
        accessor: 'notes',
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <div>
            <button onClick={() => rollbackOrder(row.original._id)}>Rollback</button>
            <button onClick={() => deleteOrder(row.original._id)}>Delete</button>
          </div>
        ),
      },
    ],
    [rollbackOrder, deleteOrder]
  );

  const deletedColumns = React.useMemo(
    () => [
      {
        Header: 'Sales Rep',
        accessor: 'salesRep',
      },
      {
        Header: 'Customer Account',
        accessor: 'customerAccount',
        sortType: 'alphanumeric',
      },
      {
        Header: 'Design Proof',
        accessor: 'designProof',
        Cell: ({ value }) => (value ? 'Yes' : 'No'),
      },
      {
        Header: 'Silkprint Film',
        accessor: 'silkprintFilm',
        Cell: ({ value }) => (value ? 'Yes' : 'No'),
      },
      {
        Header: 'Embroidery',
        accessor: 'embroidery',
        Cell: ({ value }) => (value ? 'Yes' : 'No'),
      },
      {
        Header: 'Decal',
        accessor: 'decal',
      },
      {
        Header: 'DTF',
        accessor: 'dtf',
      },
      {
        Header: 'Medal',
        accessor: 'medal',
      },
      {
        Header: 'Trophy',
        accessor: 'trophy',
      },
      {
        Header: 'Pickup Date',
        accessor: 'pickupDate',
        sortType: (a, b) => {
          const dateA = new Date(a.original.pickupDate);
          const dateB = new Date(b.original.pickupDate);
          return dateA - dateB;
        },
      },
      {
        Header: 'Notes',
        accessor: 'notes',
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: data || [] }, useSortBy);

  const {
    getTableProps: getDeletedTableProps,
    getTableBodyProps: getDeletedTableBodyProps,
    headerGroups: deletedHeaderGroups,
    rows: deletedRows,
    prepareRow: prepareDeletedRow,
  } = useTable({ columns: deletedColumns, data: deletedData || [] }, useSortBy);

  const getStatusClassName = (status) => {
    switch (status) {
      case 'Complete':
        return styles.complete;
      case 'Deleted':
        return styles.deleted;
      default:
        return '';
    }
  };

  return (
    <div>
      <h1>Completed Orders</h1>
      <div>
        <button onClick={() => setActiveTab('complete')}>Complete</button>
        <button onClick={() => setActiveTab('delete')}>Deleted</button>
      </div>
      {activeTab === 'complete' ? (
        <table {...getTableProps()} className={styles.table}>
          <thead>
            {headerGroups.map((headerGroup, headerGroupIndex) => (
              <tr key={headerGroupIndex} {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, columnIndex) => (
                  <th key={columnIndex} {...column.getHeaderProps(column.getSortByToggleProps())}>
                    {column.render('Header')}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? ' 🔽'
                          : ' 🔼'
                        : ''}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row, rowIndex) => {
              prepareRow(row);
              return (
                <tr key={rowIndex} {...row.getRowProps()} className={getStatusClassName(row.original.status)}>
                  {row.cells.map((cell, cellIndex) => (
                    <td key={cellIndex} {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <table {...getDeletedTableProps()} className={styles.table}>
          <thead>
            {deletedHeaderGroups.map((headerGroup, headerGroupIndex) => (
              <tr key={headerGroupIndex} {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, columnIndex) => (
                  <th key={columnIndex} {...column.getHeaderProps(column.getSortByToggleProps())}>
                    {column.render('Header')}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? ' 🔽'
                          : ' 🔼'
                        : ''}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getDeletedTableBodyProps()}>
            {deletedRows.map((row, rowIndex) => {
              prepareDeletedRow(row);
              return (
                <tr key={rowIndex} {...row.getRowProps()} className={getStatusClassName(row.original.status)}>
                  {row.cells.map((cell, cellIndex) => (
                    <td key={cellIndex} {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
