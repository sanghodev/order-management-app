import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTable } from 'react-table';
import styles from '../styles/Table.module.css';

export default function Print2({ socket }) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders');
      setOrders(
        res.data.data.filter(
          (order) =>
            order.dtf &&
            order.status !== 'Complete'
        )
      );
    } catch (error) {
      console.error('Failed to fetch orders:', error.message);
    }
  };

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

      socket.on('orderUpdated', handleOrderUpdated);

      return () => {
        socket.off('orderUpdated', handleOrderUpdated);
      };
    }
  }, [socket]);

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
      fetchOrders(); // If update fails, re-fetch the orders to reset the state
    }
  }, [socket]);

  const completeOrder = useCallback(async (id) => {
    try {
      await axios.put(`/api/orders/${id}/complete`);
      fetchOrders(); // Fetch the latest orders after completing an order
      if (socket) {
        socket.emit('orderUpdated', { _id: id, status: 'Complete' });
      }
    } catch (error) {
      console.error('Failed to complete order:', error.message);
    }
  }, [socket]);

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
        Header: 'DTF',
        accessor: 'dtf',
        Cell: ({ value }) => value, // 수량 표시
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
            <button onClick={() => updateOrderStatus(row.original._id, 'In Progress')}>Start</button>
          </div>
        ),
      },
    ],
    [updateOrderStatus]
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
      <h1>Print2 Team Orders</h1>
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
