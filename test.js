import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";


const completeCrud = new Trend('total_time_user_crud');

const BASE_HEADERS = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

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
    check(res, { 
        'status is 200': (r) => r.status === 200,
        'token was generated': (r) => r.json().token !== undefined,
    });
    return res.json().token; 
}


export default function (token) 
{
    let start = new Date().getTime();
    let idBooking;
    group('01. Creation Phase', () => 
    {
        const params = { headers: BASE_HEADERS };
        const body = JSON.stringify
        ({
            'firstname': 'Juan', 'lastname' : 'Gozzi','totalprice': 654, 'depositpaid': true,
            'bookingdates': { 'checkin': '2026-01-01', 'checkout': '2026-05-06' },
            'additionalneeds' : 'Internet and lunch.'
        });
        sleep(Math.random() * 8 + 1);
        const res = http.post(`${BASE_URL}/booking`, body, params);
        check(res, { 
            'Booking created succesfully': (r) => r.status === 200,
            'The id format is correctly': (r) => typeof r.json().bookingid === 'number',
            'It took less than a second': (r) => r.timings.duration < 1000 
        });        
        idBooking = res.json().bookingid;
    });


    group('02. Reading Phase', () => 
    {
        sleep(Math.random() * 8 + 1);
        const params = { headers: { 'Accept': 'application/json' }, tags: { name: '02. Consult_My_Booking' } };
        const mine = http.get(`${BASE_URL}/booking/${idBooking}`, params);
        check(mine, { 
            'Reading completed': (r) => r.status === 200,
            'The saved name is Juan': (r) => r.json().firstname === 'Juan',
            'The saved lastname is Gozzi': (r) => r.json().lastname === 'Gozzi',
            'The price is correct': (r) => r.json().totalprice === 654
        });
    });


    group('03. Update Phase', () => 
    {
        sleep(Math.random() * 8 + 1);
        const body = { 'bookingdates': { 'checkin': '2026-06-10', 'checkout': '2026-06-18' } }
        const params = 
        { 
            headers: { ...BASE_HEADERS, 'Cookie': `token=${token}` }, 
            tags: { name: '03. Modify_Booking' } 
        };
        let modified = http.patch(`${BASE_URL}/booking/${idBooking}`, JSON.stringify(body), params);
        check(modified, { 
            'Update completed successfully': (r) => r.status === 200,
            'The check-in date was updated': (r) => r.json().bookingdates.checkin === '2026-06-10'
        });
    });
        
    
    group('04. Delete Phase', () => 
    {
        sleep(Math.random() * 8 + 1);
        const params = { headers: { 'Content-Type': 'application/json', 'Cookie': `token=${token}` }, tags: { name: '04. Delete_Booking' } };
        let request = http.del(`${BASE_URL}/booking/${idBooking}`, null, params);
        check(request, { 
            'Booking deleted successfully': (r) => r.status === 201 
        });
        let end = new Date().getTime();
        completeCrud.add(end - start);
    });
}


export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    "reporte_booker.html": htmlReport(data),
  };
}
