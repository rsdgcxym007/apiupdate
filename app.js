const express = require('express')
const cors = require('cors')
const app = express()
const port = 9000
const jwt = require('./src/middlewares/jwt')
const moment = require('moment')
const multer = require('multer')
var fs = require('fs');
const Client = require('ssh2-sftp-client')
const sequelize = require('sequelize')
const {
  QueryTypes
} = require('sequelize')
const sftp = new Client();
const {
  Op
} = require("sequelize");
const db = require('./src/db/models')

const storage = multer.memoryStorage();

const fileUpload = multer({
  storage
})

app.use(cors())
app.use(express.json({
  limit: '100mb'
}));
app.use(express.urlencoded({
  extended: false,
  limit: '100mb',
}))
app.use(express.json())

app.get('/image/:name', async (req, res) => {
  const {
    name
  } = req.params
  res.writeHead(200, {
    'content-type': 'image/jpg'
  });
  fs.createReadStream(`uploads/${name}`).pipe(res);
})

app.post('/api/upload2', async (req, res) => {

  const {
    data
  } = req.body;

  const image = await db.uploadimages.create(data)

  const status = await db.status.findOne({
    where: {
      name: data.status
    }
  })

  await db.tasks.update({
    img_id: image.id,
    status_id: status.id
  }, {
    where: {
      remark: data.task
    }
  })

  return res.json({
    message: "success"
  })
})

app.post('/api/upload', fileUpload.single('file'), async (req, res) => {
  const configFSTP = {
    host: '185.78.167.48',
    port: '22',
    username: 'root',
    password: 'Password123'
  }
  const folderUploads = '/root/uploads'
  const {
    buffer,
    originalname
  } = req.file

  const filename = Date.now() + "_" + originalname

  await sftp.connect(configFSTP).then(async () => {
    await sftp.mkdir(folderUploads);
    await sftp.put(buffer, folderUploads + '/' + filename).then(() => sftp.end())
  })
  return res.json({
    data: 123
  })
})

app.get('/', async (req, res) => {
  const result = await db.types.findAll();

  result.forEach(x => {
    x.created_at = moment(x.created_at).format("YYYY-MM-DD HH:mm:ss")
    x.updated_at = moment(x.created_at).format("YYYY-MM-DD HH:mm:ss")
  })

  return res.json(result)
})


app.post('/api/auth/login', async (req, res) => {
  const {
    email,
    password
  } = req.body;


  let errorFlag = false
  let message = 'fail'


  const data = await db.users.findOne({
    where: {
      email,
      password
    }
  });

  if (!data || errorFlag) {
    return res.json({
      result: false,
      message
    })
  }
  const {
    first_name,
    last_name
  } = data

  const token = await jwt.generatetoken(data);
  return res.json({
    result: true,
    message: 'success',
    first_name,
    last_name,
    token
  })
})

app.post('/api/auth/register', async (req, res) => {
  const data = req.body;

  // return res.json(data)
  const {
    first_name,
    last_name,
    tel,
    email,
    password,
    address,
    group
  } = data
  let error = false;
  let message = '';
  let count = 0

  const {
    id
  } = await db.groups.findOne({
    where: {
      [Op.and]: [{
        name: {
          [Op.ne]: 'แอดมิน'
        }
      }, {
        name: group
      }]
      // name: group,
      // id: {
      //   [Op.ne]: 1
      // }
      // name: {
      //   [Op.ne]: 'แอดมิน'
      // }
    },
    attributes: ["id"]
  })

  data.group_id = id

  delete data.group

  if (!first_name.length > 0) {
    message += !count ? 'first_name less than 0 char' : ', first_name less than 0 char'
    count++
    error = true
  }
  if (!last_name.length > 0) {
    message += !count ? 'last_name less than 0 char' : ", " + 'last_name less than 0 char'
    count++
    error = true
  }
  if (tel.length !== 10) {
    message += !count ? 'tel equal 10 char' : ", " + 'tel equal 10 char'
    count++
    error = true
  }
  if (!email.length > 8) {
    message += !count ? 'email less than 8 char' : ", " + 'email less than 8 char'
    count++
    error = true
  }
  if (!password.length > 8) {
    message += !count ? 'password less than 8 char' : ", " + 'password less than 8 char'
    count++
    error = true
  }
  if (!address.length > 5) {
    message += !count ? 'address less than 5 char' : ", " + 'address less than 5 char'
    count++
    error = true
  }
  const user = await db.users.findOne({
    where: {
      email: data.email
    }
  })
  if (user) {
    if (user.email === email) {
      message += !count ? 'อีเมลนี้ถูกใช้ไปแล้ว' : ", " + 'อีเมลนี้ถูกใช้ไปแล้ว'
      count++
      error = true
    }
  }

  if (error) {
    return res.json({
      result: false,
      message
    })
  }

  await db.users.create(data);

  return res.json({
    result: true,
    message: 'register success'
  })

})

app.get('/api/auth/user', jwt.verifytoken, async (req, res) => {
  const payload = req.jwtpayload
  return res.json(payload);
})

app.get('/api/master/type', async (req, res) => {
  const result = await db.types.findAll({
    order: [
      ["name", "asc"]
    ]
    // orderBy: [{
    //   name: 'asc',
    // }, ]
  });

  if (!result) {
    return res.json({
      result: null,
      message: "error"
    })
  }

  const items = result.map(function (item) {
    return item['name'];
  });
  return res.json({
    result: items,
    message: "success"
  })
})

app.get('/api/master/group', async (req, res) => {
  const result = await db.groups.findAll({
    where: {
      name: {
        [Op.ne]: 'แอดมิน'
      }
    },
    order: [
      ["name", "asc"]
    ]
    // orderBy: [{
    //   name: 'asc',
    // }, ],
  });

  if (!result) {
    return res.json({
      result: null,
      message: "error"
    })
  }

  const items = result.map(function (item) {
    return item['name'];
  });
  return res.json({
    result: items,
    message: "success"
  })
})

app.post('/api/manage/request', async (req, res) => {
  let data = req.body

  const status = await db.status.findOne({
    where: {
      name: data.status_id
    }
  })

  data.status_id = status.id

  const type = await db.types.findOne({
    where: {
      name: data.type
    }
  })
  delete data.type
  data.type_id = type.id


  const task = await db.tasks.create(data)


  if (!task) {
    return res.json({
      result: false,
      message: "request error"
    })
  }

  return res.json({
    result: true,
    message: "request success"
  })
})

app.post('/api/manage/update', async (req, res) => {
  let data = req.body
  const task = await db.tasks.update({
    remark: data.remark,

  }, {
    where: {
      user_id: data.user_id
    }
  })



  if (!task) {
    return res.json({
      result: false,
      message: "request error"
    })
  }

  return res.json({
    result: true,
    message: "update success"
  })
})

app.post('/api/manage/taskall', async (req, res) => {
  const {
    userId
  } = req.body
  // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
  const [results, metadata] = await db.sequelize.query(`select * from vw_tasks a where a."user_id" = '${userId}'`);
  const headers = [{
      text: 'สถานะ',
      value: 'status_name'
    }, {
      text: 'ประเภท',
      value: 'type'
    },
    {
      text: 'ชื่อผู้ป่วย',
      value: 'name'
    },
    {
      text: 'เบอร์โทร',
      value: 'tel'
    },
    {
      text: 'ที่อยู่',
      value: 'address'
    },
    {
      text: 'คำอธิบาย',
      value: 'remark'
    },

    {
      text: 'วันที่สร้าง',
      value: 'created_at'
    }
    // {
    //   text: 'ช่วยเหลือ',
    //   value: 'help'
    // },
  ];
  return res.json({
    result: results,
    headers
  })
});

app.post('/api/tasks/getbyuser', async (req, res) => {

  const {
    user_id
  } = req.body;

  const result = await db.tasks.findAll({
    where: {
      user_id
    }
  });

  const items = result.map(function (item) {
    return item['remark'];
  });

  return res.json({
    result: items,
    // headers
  })
});

app.get('/api/manage/report', async (req, res) => {

  const [results, metadata] = await db.sequelize.query(`select 
  concat(b.first_name, ' ', b.last_name) fullname,
  a.remark ,
  d."name" statusname,
  c.hospital,
  a.updated_at,
  c.image_medical
  from tasks a
  inner join users b on a.user_id = b.id
  inner join uploadimages c on a.img_id = c.id
  inner join status d on a.status_id = d.id `);

  return res.json({
    result: results,
    // headers
  })
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})