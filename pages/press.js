import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTable } from 'react-table';
import styles from '../styles/Table.module.css';

export default function Press({ socket }) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/orders');
      setOrders(
        res.data.data.filter(
          (order) =>
            (order.decal || order.dtf) &&
            order.status !== 'Complete' &&
            order.status !== 'Deleted'
        )
      );
    } catch (error) {
      console.error('Failed to fetch orders:', error.message);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    if (socket) {
      const handleOrderUpdated = (updatedOrder) => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          )
        );
      };

      const handleOrderCompleted = (completedOrder) => {
        setOrders((prevOrders) => prevOrders.filter(order => order._id !== completedOrder._id));
      };

      socket.on('orderUpdated', handleOrderUpdated);
      socket.on('orderCompleted', handleOrderCompleted);

      return () => {
        socket.off('orderUpdated', handleOrderUpdated);
        socket.off('orderCompleted', handleOrderCompleted);
      };
    }
  }, [socket, fetchOrders]);

  const updateOrderStatus = useCallback(async (id, newStatus) => {
    try {
      const res = await axios.put(`/api/orders/${id}`, { status: newStatus });
      const updatedOrder = res.data.data;
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
      if (socket) {
        socket.emit('updateOrder', updatedOrder);
      }
    } catch (error) {
      console.error(`Failed to update order status to ${newStatus}:`, error.message);
      fetchOrders();
    }
  }, [socket, fetchOrders]);

  const completeOrder = useCallback(async (id) => {
    try {
      const res = await axios.put(`/api/orders/${id}/complete`);
      const updatedOrder = res.data.data;
      setOrders((prevOrders) => prevOrders.filter(order => order._id !== updatedOrder._id));
      if (socket) {
        socket.emit('orderCompleted', updatedOrder);
      }
    } catch (error) {
      console.error('Failed to complete order:', error.message);
    }
  }, [socket, fetchOrders]);

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
      },
      {
        Header: 'Decal',
        accessor: 'decal',
        Cell: ({ value }) => (value ? 'Yes' : 'No'),
      },
      {
        Header: 'DTF',
        accessor: 'dtf',
        Cell: ({ value }) => (value ? 'Yes' : 'No'),
      },
      {
        Header: 'Pickup Date',
        accessor: 'pickupDate',
      },
      {
        Header: 'Notes',
        accessor: 'notes',
      },
      {
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <div>
            <button onClick={() => updateOrderStatus(row.original._id, 'Hold')}>Hold</button>
            <button
              onClick={() => updateOrderStatus(row.original._id, 'Done')}
              disabled={row.original.status !== 'In Progress'}
              className={row.original.status !== 'In Progress' ? styles.disabledButton : ''}
            >
              Done
            </button>
            {/* <button onClick={() => completeOrder(row.original._id)}>Complete</button> */}
          </div>
        ),
      },
    ],
    [updateOrderStatus, completeOrder]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data });

  const getStatusClassName = (status) => {
    switch (status) {
      case 'In Progress':
        return styles.inProgress;
      case 'Hold':
        return styles.hold;
      case 'Done':
        return styles.done;
      case 'Deleted':
        return styles.deleted;
      default:
        return '';
    }
  };

  return (
    <div>
      <h1>Press Team Orders</h1>
      <table {...getTableProps()} className={styles.table}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th key={column.id} {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr key={row.id} {...row.getRowProps()} className={getStatusClassName(row.original.status)}>
                {row.cells.map(cell => (
                  <td key={cell.column.id} {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
