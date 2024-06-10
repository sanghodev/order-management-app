import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTable, useSortBy } from 'react-table';
import styles from '../styles/Table.module.css';

export default function Complete({ socket }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchCompletedOrders();

    if (socket) {
      socket.on('orderUpdated', (updatedOrder) => {
        if (updatedOrder.status === 'Complete') {
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order._id === updatedOrder._id ? updatedOrder : order
            )
          );
        } else {
          setOrders((prevOrders) => prevOrders.filter((order) => order._id !== updatedOrder._id));
        }
      });

      return () => {
        socket.off('orderUpdated');
      };
    }
  }, [socket]);

  const fetchCompletedOrders = async () => {
    try {
      const res = await axios.get('/api/orders?status=Complete');
      setOrders(res.data.data);
    } catch (error) {
      console.error('Failed to fetch completed orders:', error.message);
    }
  };

  const rollbackOrder = async (id) => {
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
  };

  const data = React.useMemo(() => orders, [orders]);

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
          </div>
        ),
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
  } = useTable({ columns, data }, useSortBy);

  const getStatusClassName = (status) => {
    switch (status) {
      case 'Complete':
        return styles.complete;
      default:
        return '';
    }
  };

  return (
    <div>
      <h1>Completed Orders</h1>
      <table {...getTableProps()} className={styles.table}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
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
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} className={getStatusClassName(row.original.status)}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
