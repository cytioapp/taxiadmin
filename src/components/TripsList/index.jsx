import React, {Component} from 'react';
import { Table } from 'reactstrap';
import Api from '../../utils/api';
import { init, instance } from '../../firebase'
import Item from './Item';
import AlertMessage from '../../sharedComponents/AlertMessage';
import { Pagination, PaginationItem, PaginationLink } from 'reactstrap';
import moment from 'moment';
var times = [];

export default class TripsList extends Component {

  state = {
    trips: [],
    errors: null,
    flash: null,
    selectedPage: 1,
    status: 'holding',
    pageCount: 0
  }

  logTimes = () => {
    console.log(times)
  }

  componentDidMount() {
    const flash = this.props.location.flash;
    if (flash) this.setState({flash});
    this.getHoldingTrips();
    // Api.get(`/trips?status=${this.state.status}`)
    //   .then(res => {
    //     const {trips, pageCount} = res.data;
    //     this.setState({
    //       trips,
    //       pageCount
    //     })
    //   });
  }

  getHoldingTrips = () => {
    instance()
      .database()
      .ref(`server/holding_trips/`)
      .on('value', snapshot => {
        console.log(snapshot.val())
        const trips = snapshot.val()
        if (trips && this.state.status === 'holding') {
          this.setState({ trips: Object.values(trips) })
        } else {
          this.setState({ trips: [], pageCount: 0 })
        }
      })
  }

  deleteItem = (trip_id) => {
    Api.delete(`/trip/${trip_id}`)
      .then(res => {
        const trips = this.state.trips.filter((trip) => trip.id !== trip_id)
        this.setState({
          trips,
          flash: {
            type: "success",
            message: res.data.flash[0]
          }
        })
      })
      .catch((err) => {
        this.setState({
          errors: { message: err.response.data.errors[0] }
        })
      });
  }

  nextItem = () => {
    const {selectedPage, pageCount} = this.state;
    if (selectedPage < pageCount){
      Api.get(`/trips?page=${selectedPage + 1}&status=${this.state.status}`)
        .then(res => {
          const {trips, pageCount} = res.data;
          this.setState({
            trips,
            selectedPage: selectedPage + 1,
            pageCount
          })
        });
    }
  }

  previousItem = () => {
    const {selectedPage} = this.state;
    if (selectedPage > 1){
      Api.get(`/trips?page=${selectedPage - 1}&status=${this.state.status}`)
        .then(res => {
          const {trips, pageCount} = res.data;
          this.setState({
            trips,
            selectedPage: selectedPage - 1,
            pageCount
          })
        });
    }
  }

  getPage = event => {
    let page = 1;
    if (typeof event === 'number') {
      page = event;
    } else {
      page = parseInt(event.target.dataset.page);
    }
    Api.get(`/trips?page=${page}&status=${this.state.status}`)
      .then(res => {
        const {trips, pageCount} = res.data;
        this.setState({
          trips,
          selectedPage: page,
          pageCount
        })
      });
  }

  onStatusChange = (ev) => {
    this.setState({
      status: ev.target.value,
      selectedPage: 1,
      errors: null,
      flash: null
    }, () => {
      if (this.state.status === 'holding') {
        this.getHoldingTrips();
      } else {
        this.getPage(1)
      }
    })
  }

  render(){
    const {trips, errors, flash, pageCount, selectedPage, status} = this.state;
    return(
      <div>
        <h2>Servicios activos</h2>
        <div>
          <select name="" id="" onChange={this.onStatusChange} value={status}>
            <option value="holding">En espera</option>
            <option value="finished">Finalizados</option>
            {/*<option value="taken">Tomado</option>*/}
            <option value="active">Activo/Tomado</option>
            <option value="canceled">Cancelado</option>
          </select>
          <button onClick={this.logTimes}>
            Log tiempos
          </button>
        </div>
        {errors && <AlertMessage message={alert.message}/>}
        {flash && <AlertMessage alertType={flash.type} message={flash.message}/>}
        <div>
          <Table striped>
            <thead>
              <tr>
                <th>#</th>
                <th>Status</th>
                <th>Usuario</th>
                <th>Chofer</th>
                <th>Direccion</th>
                <th>Fecha</th>
                <th>Tiempo</th>
                <th>Lapso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {
                trips.map((trip) => {
                  var difference = moment(trip.updated_at).diff(moment(trip.created_at), 'seconds') / 60;
                  times.push(difference.toFixed(2));
                  return <Item key={trip.id} trip={trip} deleteItem={this.deleteItem}/>
                })
              }
            </tbody>
          </Table>
          <Pagination className="pagination" >
            <PaginationItem>
              <PaginationLink previous onClick={this.previousItem}/>
            </PaginationItem>
            {
              new Array(pageCount).fill(0).map((val, index) => {
                return(
                  <PaginationItem key={index} active={index + 1 === selectedPage}>
                    <PaginationLink data-page={index + 1} onClick={this.getPage}>
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                )
              })
            }
            <PaginationItem>
              <PaginationLink next onClick={this.nextItem}/>
            </PaginationItem>
          </Pagination>
        </div>
      </div>
    )
  }
}
