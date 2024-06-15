import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTable } from 'react-table';
import styles from '../styles/Table.module.css';

export default function Status({ socket }) {
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    salesRep: '',
    customerAccount: '',
    designProof: false,
    silkprintFilm: false,
    embroidery: false,
    decal: 0,
    dtf: 0,
    medal: 0,
    trophy: 0,
    pickupDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchOrders();

    if (socket) {
      socket.on('orderUpdated', (updatedOrder) => {
        console.log('Order updated received:', updatedOrder);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          )
        );
      });

      return () => {
        socket.off('orderUpdated');
      };
    }
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data.data.filter(order => order.status !== 'Complete' && order.status !== 'Deleted'));
    } catch (error) {
      console.error('Failed to fetch orders:', error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await handleUpdate(editing);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`/api/orders/${id}`, form);
      fetchOrders();
      setForm({
        salesRep: '',
        customerAccount: '',
        designProof: false,
        silkprintFilm: false,
        embroidery: false,
        decal: 0,
        dtf: 0,
        medal: 0,
        trophy: 0,
        pickupDate: '',
        notes: '',
      });
      setEditing(null);
    } catch (error) {
      console.error('Failed to update order:', error.message);
    }
  };

  const handleEdit = (order) => {
    setForm({
      salesRep: order.salesRep,
      customerAccount: order.customerAccount,
      designProof: order.designProof,
      silkprintFilm: order.silkprintFilm,
      embroidery: order.embroidery,
      decal: order.decal,
      dtf: order.dtf,
      medal: order.medal,
      trophy: order.trophy,
      pickupDate: order.pickupDate,
      notes: order.notes,
    });
    setEditing(order._id);
  };

  const updateOrderStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(`/api/orders/${id}`, { status: newStatus });
      const updatedOrder = res.data.data;
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
      console.log('Emitting order update:', updatedOrder);
      if (socket) {
        socket.emit('updateOrder', updatedOrder);
      }
    } catch (error) {
      console.error(`Failed to update order status to ${newStatus}:`, error.message);
      fetchOrders(); // If update fails, re-fetch the orders to reset the state
    }
  };

  const completeOrder = async (id) => {
    try {
      const res = await axios.put(`/api/orders/${id}/complete`);
      const updatedOrder = res.data.data;
      setOrders((prevOrders) => prevOrders.filter(order => order._id !== updatedOrder._id));
      console.log('Emitting order completion:', updatedOrder);
      if (socket) {
        socket.emit('orderUpdated', updatedOrder);
      }
      fetchOrders(); // Fetch orders to update the list after completion
    } catch (error) {
      console.error('Failed to complete order:', error.message);
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
            {/* <button onClick={() => updateOrderStatus(row.original._id, 'In Progress')}>Start</button>
            <button onClick={() => updateOrderStatus(row.original._id, 'Hold')}>Hold</button>
            <button onClick={() => updateOrderStatus(row.original._id, 'Done')}>Done</button>
            <button onClick={() => completeOrder(row.original._id)}>Complete</button> */}
            <button onClick={() => handleEdit(row.original)}>Edit</button>
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
      <h1>Order Status</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="salesRep"
          value={form.salesRep}
          onChange={handleChange}
          placeholder="Sales Representative"
          required
        />
        <input
          type="text"
          name="customerAccount"
          value={form.customerAccount}
          onChange={handleChange}
          placeholder="Customer Account"
          required
        />
        <label>
          <input
            type="checkbox"
            name="designProof"
            checked={form.designProof}
            onChange={handleChange}
          />
          Design Proof
        </label>
        <label>
          <input
            type="checkbox"
            name="silkprintFilm"
            checked={form.silkprintFilm}
            onChange={handleChange}
          />
          Silkprint Film
        </label>
        <label>
          <input
            type="checkbox"
            name="embroidery"
            checked={form.embroidery}
            onChange={handleChange}
          />
          Embroidery
        </label>
        <input
          type="number"
          name="decal"
          value={form.decal}
          onChange={handleChange}
          placeholder="Decal Quantity"
        />
        <input
          type="number"
          name="dtf"
          value={form.dtf}
          onChange={handleChange}
          placeholder="DTF Quantity"
        />
        <input
          type="number"
          name="medal"
          value={form.medal}
          onChange={handleChange}
          placeholder="Medal Quantity"
        />
        <input
          type="number"
          name="trophy"
          value={form.trophy}
          onChange={handleChange}
          placeholder="Trophy Quantity"
        />
        <input
          type="date"
          name="pickupDate"
          value={form.pickupDate}
          onChange={handleChange}
          required
        />
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Notes"
        />
        <button type="submit">{editing ? 'Update Order' : 'Edit Order'}</button>
      </form>
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
                  <td key={cell.id} {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
