const express = require('express');
const cors = require('cors');
const knex = require('knex');

const app = express();

app.use(express.json());
app.use(cors());

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: '',
    database: 'railway-reservation',
  }
});

//db.select().from('users').then(data => { console.log(data)})

const admin = {
	email: 'admin',
	password: 'admin'
}

const ac_coach_composition = ['LB','LB','UB','UB','SL','SU','LB','LB','UB','UB','SL','SU','LB','LB','UB','UB','SL','SU'];
const sleeper_coach_composition = ['LB','MB','UB','LB','MB','UB','SL','SU','LB','MB','UB','LB','MB','UB','SL','SU','LB','MB','UB','LB','MB','UB','SL','SU']

var pnr = 0;

app.get('/', (req,res) => { res.send('it is working') })

app.listen(3000, ()=> { console.log('app is running on port 3000') })

app.post('/signinuser', (req, res) => {
	const {email, password} = req.body;
    
    db.select('emailid','password').from('users')
      .where('emailid', '=', email)
      .then(data => {
          if(data[0].password === password)
          	 res.json('success')
          else
          	res.status(400).json('unable to login')
      })
      .catch(err => res.status(400).json('unable to login'))
}) 

app.post('/signinadmin', (req, res) => {
	if (req.body.email === admin.email && req.body.password === admin.password){
		res.json('success');
	}
	else{
	    res.status(400).json('unable to login');
	}
})

app.post('/register', (req, res) => {
	const {name, email, password, address, mobile} = req.body;
 
    if(!name || !email || !password || !address || !mobile)
     return res.status(400).json('unable to register');

	db('users')
       .returning('*')
	   .insert({
		   name: name,
		   emailid: email,
		   password: password,
		   address: address,
		   mobile: mobile
	     })
	    .then(user => {
	    	res.json(user[0]);
	    })
	    .catch(err => res.status(400).json('unable to register'))
})

app.post('/gettraindetails', (req, res) => {
      db.select('*')
        .returning('*')
        .from('traindetails')
        .then(data => {
          res.json(data);
        })
        .catch(err => res.status(400).json('unable to add train'))
})

app.post('/traindetails', (req, res) => {
	  const {trainnumber, date, sleeper, ac} = req.body;
	
    if(!trainnumber || !ac || !sleeper || !date)
      return res.status(400).json('Fill all the details');  
    
    var today = new Date(); 
    var d = String(today.getDate()).padStart(2, '0');
    var m = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var y = today.getFullYear();

   // var date1 = '2015-08-20';
    var date2 = y + '-' + m + '-' + d;
    var date1Updated = new Date(date.replace(/-/g,'/'));  
    var date2Updated = new Date(date2.replace(/-/g,'/'));
    
    if( date2Updated > date1Updated)
      return res.status(400).json('Date should be correct');


    db.select('train_id','date_of_journey')
      .from('traindetails')
      .where({
      	train_id: trainnumber,
      	date_of_journey: date
      })
      .then(data => {
      	 if(data.length !== 0)
      	 	res.status(400).json('Train Already exist on the same date') 
      })
      .catch(err => res.status(400).json('unable to add train'))


	db('traindetails')
       .returning('*')
	   .insert({
		   train_id: trainnumber ,
		   date_of_journey: date,
		   sleeper: sleeper,
		   ac: ac,
		   ac_seat_booked: 0,
		   sleeper_seat_booked: 0
	     })
	    .then(user => {
	    	res.json('success');
	    })
	    // .catch(err => res.status(400).json(err))
	    .catch(err => res.status(400).json('Error in adding train in booking system'))

})

app.post('/profile', (req, res) => {
	const {trainnumber, num_of_pass, date, coach} = req.body;

	if(!trainnumber || !num_of_pass || !date || !coach)
		res.status(400).json('complete all details');

  if(num_of_pass <= 0)
    res.status(400).json('Number of passenger should be more than 0');

    var today = new Date(); 
    var d = String(today.getDate()).padStart(2, '0');
    var m = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var y = today.getFullYear();

   // var date1 = '2015-08-20';
    var date2 = y + '-' + m + '-' + d;
    var date1Updated = new Date(date.replace(/-/g,'/'));  
    var date2Updated = new Date(date2.replace(/-/g,'/'));
    
    if( date2Updated > date1Updated)
      return res.status(400).json('Date should be correct');

    
  db('ticket').max('pnr').then(data => {
      //console.log(data);
      if(data[0].max === 'null')
        pnr = 0;
      else
        pnr = data[0].max;
    })
    
    db.select('train_id','date_of_journey','sleeper','ac','ac_seat_booked','sleeper_seat_booked')
      .from('traindetails')
      .where({
      	train_id: trainnumber,
      	date_of_journey: date
      })
      .then(data => {
      	 if(data.length === 0)
      	 	res.status(400).json('Train number on the mentioned date is not their in the booking system')
      	 else{
      	    if(coach === 'AC'){
                 const ac_seats = 18*(data[0].ac) - data[0].ac_seat_booked;
                 if(ac_seats >= num_of_pass)
                          res.json('success');
                 else
                 	 res.status(400).json('Seats not available')
               }
      	    else{
                 const sleeper_seats = 24*(data[0].sleeper) - data[0].sleeper_seat_booked;
                 if(sleeper_seats >= num_of_pass)
                          res.json('success');
                 else
                 	 res.status(400).json('Seats not available')
      	    }
      	   }	 
      })
      .catch(err => res.status(400).json('Error!!!'))
})

app.post('/passengerDetails', (req, res) => {
	
	  const {details, number_of_pass, coach, train_id, date, agent_email} = req.body;
    let ac_seat_booked, sleeper_seat_booked;     
    const tickets = [];
    console.log('PNR value',pnr);
    console.log(agent_email);
    
    db.select('*')
      .from('traindetails')
      .where({
      	train_id: train_id,
      	date_of_journey: date
        })
      .then( data => {
          ac_seat_booked = data[0].ac_seat_booked;
          sleeper_seat_booked = data[0].sleeper_seat_booked;
          
          if(coach === 'AC'){
          	 for(let i=0;i<number_of_pass;i++){
             	const c = 'A' + (Math.trunc(ac_seat_booked/18) + 1);
             	const berth = ac_seat_booked%18 + 1;
             	const type = ac_coach_composition[berth - 1];
             	ac_seat_booked = ac_seat_booked + 1;
              pnr++;

              db('passenger')
             	 .returning('*')
             	 .insert({
             	 	pnr: pnr,
             	 	name: details[i].name,
             	 	age: details[i].age,
             	 	gender: details[i].gender,
             	 	berth: berth,
             	 	type: type,
             	 	coach: c
             	 })
               .then(data => {
                  tickets.push({
                    name: data[0].name,
                    age: data[0].age,
                    gender: data[0].gender,
                    berth: data[0].berth,
                    coach: data[0].coach,
                    type: data[0].type,
                    pnr: data[0].pnr,
                    train_id: train_id,
                    date: date
                  })

                  if(i === (number_of_pass - 1))
                    res.json(tickets);
               })
             	 .catch(err => res.status(400).json("Error!!"))

              db('ticket')
             	 .returning('*')
             	 .insert({
             	 	pnr: pnr,
             	 	train_id: train_id,
             	 	date_of_journey: date
             	 })
             	 .catch(err => res.status(400).json('Error!!')) 
                
              db('bookingdoneby')
             	 .returning('*')
             	 .insert({
             	 	pnr: pnr,
             	 	agent_emailid: agent_email
             	 })
             	 .catch(err => res.status(400).json('Error!!'))

              db('traindetails')
                .where({
                train_id: train_id,
                date_of_journey: date
                })
               .increment('ac_seat_booked', 1)
               .catch(err => res.status(400).json('Error!!'))
                   
             }
           }
          
          else{
             for(let i=0;i<number_of_pass;i++){
             	const c = 'S' + (Math.trunc(sleeper_seat_booked/24) + 1);
             	const berth = sleeper_seat_booked%24 + 1;
             	const type = sleeper_coach_composition[berth - 1];
             	sleeper_seat_booked = sleeper_seat_booked + 1;
             	pnr++;
             	
              db('passenger')
             	 .returning('*')
             	 .insert({
             	 	pnr: pnr,
             	 	name: details[i].name,
             	 	age: details[i].age,
             	 	gender: details[i].gender,
             	 	berth: berth,
             	 	type: type,
             	 	coach: c
             	 })
               .then(data => {
                  tickets.push({
                    name: data[0].name,
                    age: data[0].age,
                    gender: data[0].gender,
                    berth: data[0].berth,
                    coach: data[0].coach,
                    type: data[0].type,
                    pnr: data[0].pnr,
                    train_id: train_id,
                    date: date
                  })

                  if(i === (number_of_pass - 1))
                    res.json(tickets);
                })
             	 .catch(err => res.status(400).json('Error!!'))

             	db('ticket')
             	 .returning('*')
             	 .insert({
             	 	pnr: pnr,
             	 	train_id: train_id,
             	 	date_of_journey: date
             	 })
             	 .catch(err => res.status(400).json('Error!!')) 
                
                db('bookingdoneby')
             	 .returning('*')
             	 .insert({
             	 	pnr: pnr,
             	 	agent_emailid: agent_email
             	 })
             	 .catch(err => res.status(400).json('Error!!'))

               db('traindetails')
                .where({
                  train_id: train_id,
                  date_of_journey: date
                   })
                .increment('sleeper_seat_booked', 1) 
                .catch(err => res.status(400).json('Error!!'))     
             } 
           }
      })
      .catch(err => res.status(400).json("Error!!"))
 
 })

   /* details.map(data => {
        console.log(data.name);
        console.log(data.age);
        console.log(data.gender);
      })    */

/*
/ --> res = this is working
/signinuser --> POST = success/fail
/register --> POST = user
/signinadmin --> POST = success/fail 
/traindetails --> POST = add details of success in database
/profile --> POST = details of passenger

*/
