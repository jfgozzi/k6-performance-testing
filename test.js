import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";


const crudCompletoTrend = new Trend('tiempo_total_crud_usuario');

const BASE_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

const avgLoadTest = 
{
    stages: 
    [
        { duration: '5m', target: 100 }, 
        { duration: '30m', target: 100 },
        { duration: '5m', target: 0 }, 
    ],
};

const breakpointTest = 
{
    executor: 'ramping-arrival-rate', 
    stages: [ { duration: '2h', target: 20000 }, ]
};

const soakTest = 
{
    stages: 
    [
        { duration: '5m', target: 100 }, 
        { duration: '8h', target: 100 }, 
        { duration: '5m', target: 0 }, 
    ],
};

const spikeTest = 
{
    stages: 
    [
        { duration: '2m', target: 2000 }, 
        { duration: '1m', target: 0 }, 
    ],
};

const stressTest = 
{
    thresholds: { http_req_failed: ['rate<0.01'] },
    stages: 
    [
        { duration: '10m', target: 200 }, 
        { duration: '30m', target: 200 }, 
        { duration: '5m', target: 0 }, 
    ],
};

const smokeTest = { vus: 3, duration: '1m' };

const BASE_URL = 'https://restful-booker.herokuapp.com';

let chosenConfig;
switch (__ENV.TIPO) 
{
    case 'average':
        chosenConfig = avgLoadTest;
        break;

    case 'breakpoint':
        chosenConfig = breakpointTest;
        break;

    case 'soak':
        chosenConfig = soakTest;
        break;

    case 'spike':
        chosenConfig = spikeTest;
        break;

    case 'stress':
        chosenConfig = stressTest;
        break;

    default:
        chosenConfig = smokeTest; 
        break;
}
export const options = chosenConfig;


export function setup() {
    const body = JSON.stringify({ username: 'admin', password: 'password123' });
    const params = { headers: { 'Content-Type': 'application/json' } };
    const res = http.post(`${BASE_URL}/auth`, body, params);
    return res.json().token; 
}


export default function (token) 
{
    let inicio = new Date().getTime();
    let idReserva;
    group('01. Creation Phase', () => 
    {
        const params = 
        {
            headers: 
            {
                'Content-Type': 'application/json',  
                'Accept': 'application/json'
            }
        };
        const body = 
        {
            'firstname': 'Juan',
            'lastname' : 'Gozzi',
            'totalprice': 654,
            'depositpaid': true,
            'bookingdates': { 'checkin': '2026-01-01', 'checkout': '2026-05-06' },
            'additionalneeds' : 'Internet and lunch.'
        };
        sleep(Math.random() * 8 + 1);
        const res = http.post(`${BASE_URL}/booking`, JSON.stringify(body), params);
        check(res, { 'Booking created successfully': (a) => a.status === 200 });
        idReserva = res.json().bookingid;
    });


    group('02. Reading Phase', () => 
    {
        sleep(Math.random() * 8 + 1);
        const params = { headers: { 'Accept': 'application/json' }, tags: { name: '02. Consult_My_Booking' } };
        const mia = http.get(`${BASE_URL}/booking/${idReserva}`, params);
        check(mia, { 'Reading of my booking completed successfully': (a) => a.status === 200 });
    });


    group('03. Update Phase', () => 
    {
        sleep(Math.random() * 8 + 1);
        const body = { 'bookingdates': { 'checkin': '2026-06-10', 'checkout': '2026-06-18' } }
        const params = { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cookie': `token=${token}` }, tags: { name: '03. Modify_Booking' } };
        let modified = http.patch(`${BASE_URL}/booking/${idReserva}`, JSON.stringify(body), params);
    });
        
    
    group('04. Delete Phase', () => 
    {
        sleep(Math.random() * 8 + 1);
        const params = { headers: { 'Content-Type': 'application/json', 'Cookie': `token=${token}` }, tags: { name: '04. Delete_Booking' } };
        let request = http.del(`${BASE_URL}/booking/${idReserva}`, null, params);
        let fin = new Date().getTime();
        crudCompletoTrend.add(fin - inicio);
    });
}


export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    "reporte_booker.html": htmlReport(data),
  };
}
