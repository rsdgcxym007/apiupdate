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
const res = require('express/lib/response')

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

  if (!status) {
    return res.json({
      result: false,
      message: "request error"
    })
  }
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
  if (!data.address || !data.position) {
    return res.json({
      result: false,
      message: 'address is required'
    })
  }
  
  const address = await db.address.create(data)
  if (address) {
    data.current_address = address.id
  }
  
  console.log(data)
  const {
    first_name,
    last_name,
    tel,
    email,
    password,
    group,
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
  console.log('data', data)
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
      id: data.id
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

app.post('/api/volunteen/taskallhelp', async (req, res) => {
  const {
    userId
  } = req.body
  // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
  const [results, metadata] = await db.sequelize.query(`select * from vw_tasks a where a.status_name = 'ขอความช่วยเหลือ' `);
  const headers = [{
      text: 'วันที่สร้าง',
      value: 'created_at'
    },
    {
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

    // {
    //   text: 'Actions',
    //   value: 'actions',
    //   sortable: false
    // },
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

app.post('/api/manage/taskallbyuserid', async (req, res) => {
  const {
    userId
  } = req.body
  // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
  const [results, metadata] = await db.sequelize.query(`select * from vw_tasks a where a."user_id" = '${userId}' ORDER BY created_at DESC `);
  const headers = [{
      text: 'สถานะ',
      value: 'status_name'
    },
    // {
    //   text: 'ระดับอาการ',
    //   value: ''
    // },
    // {
    //   text: 'ชื่อผู้ป่วย',
    //   value: 'name'
    // },
    // {
    //   text: 'เบอร์โทร',
    //   value: 'tel'
    // },
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
    },

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

// app.get('/api/manage/report', async (req, res) => {

//   const [results, metadata] = await db.sequelize.query(`select 
//   concat(b.first_name, ' ', b.last_name) fullname, 
//   a.remark ,
//   d."name" statusname,
//   c.hospital,
//   a.updated_at,
//   c.image_medical,
//   a.id
//   from tasks a
//   inner join users b on a.user_id = b.id
//   inner join uploadimages c on a.img_id = c.id
//   inner join status d on a.status_id = d.id `);

//   return res.json({
//     result: results,
//     // headers
//   })
// });

app.post('/api/volunteen/updatestatususerhelp', async (req, res) => {

  try {
    const {
      id,
      user_id_va
    } = req.body

    await db.tasks.update({
      status_id: "490089af-cb09-476d-9568-a0896a50143a",
      user_id_va
    }, {
      where: {
        id
      }
    })
    return res.json({
      result: true,
      message: "ดำเนินการสำเร็จ"
    })
  } catch (err) {
    return res.json({
      result: false,
      message: "ดำเนินการไม่สำเร็จ"
    })
  }

});


app.post('/api/volunteen/takecareuser', async (req, res) => {
  const {
    userId
  } = req.body
  // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
  const [results, metadata] = await db.sequelize.query(`
  select * from vw_tasks_volunteer a where a."volunteer_id" = '${userId}' 
  and (a.status_name = 'ช่วยเหลือเสร็จสิ้น' or a.status_name = 'กำลังช่วยเหลือ' or a.status_name = 'ยกเลิก' or a.status_name = 'หายป่วยแล้ว' )`);
  const headers = [{
      text: 'สถานะ',
      value: 'status_name'
    },
    {
      text: 'ระดับอาการ',
      value: 'level_name'
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

  ];
  return res.json({
    result: results,
    headers
  })
});

app.post('/api/volunteen/getbyuser', async (req, res) => {

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

app.post('/api/volunteen/updatereport', async (req, res) => {
  let data = req.body
  // console.log('xxxxx', data)
  const task = await db.tasks.update({
    status_id: data.status_id
  }, {
    where: {
      id: data.id
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
});

app.post('/api/volunteen/notupdatereport', async (req, res) => {
  let data = req.body
  const taskx = await db.tasks.update({
    status_id: data.status_id
  }, {
    where: {
      id: data.id
    }
  })

  return res.json({
    result: true,
    message: "update success"
  })
});

// app.post('/api/task/update', async (req, res) => {
//   let data = req.body
//   const task = await db.tasks.update({
//     status_id: data.status_id,
//     level: data.level
//   }, {
//     where: {
//       id: data.id
//     }
//   })



//   if (!task) {
//     return res.json({
//       result: false,
//       message: "request error"
//     })
//   }

//   return res.json({
//     result: true,
//     message: "update success"
//   })
// })

// app.post('/api/volunteen/updatestatus', async (req, res) => {
//   let data = req.body
//   const task = await db.status.update({
//     status_id: "05ad26ab-e04d-422e-bb3e-485c927b6bb5",
//   }, {
//     where: {
//       id: data.id
//     }
//   })
//   if (!task) {
//     return res.json({
//       result: false,
//       message: "request error"
//     })
//   }

//   return res.json({
//     result: true,
//     message: "update success"
//   })
// });

app.post('/api/tasksvolunteen/getbyIduser', async (req, res) => {

  const {
    id
  } = req.body;
  const [result, metadata] = await db.sequelize.query(`
  select * from vw_tasks a where a."id" = '${id}' 
`);

  return res.json({
    result: result[0]
  })
});

app.post('/api/update/taskallbyuserid', async (req, res) => {
  const {
    userId
  } = req.body
  // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
  const [results, metadata] = await db.sequelize.query(`select * from vw_tasks a where a."user_id" = '${userId}'`);
  return res.json({
    result: results,
  })
});

app.post('/api/manage/updatetasks', async (req, res) => {
  let data = req.body
  console.log('data from: ', data)
  const task = await db.tasks.update({
    remark: data.remark,
    cancel_detail: data.cancel_detail,
    status_id: data.status_id
  }, {
    where: {
      id: data.id
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
});

app.post('/api/manage/uploadImage', async (req, res) => {

  const {
    data
  } = req.body;

  const image = await db.uploadimages.create(data)

  await db.tasks.update({
    img_id: image.id,
    status_id: data.status_id,
    remark: data.remark

  }, {
    where: {
      id: data.task_id
    }
  })

  return res.json({
    message: "success"
  })
})

app.post('/api/tasks/getImage', async (req, res) => {
  let data = req.body
  console.log('body is: ', data)
  console.log('ID is: ', data.id)
  const results = await db.uploadimages.findOne({
    where: {
      id: data.id
    }
  });
  return res.json({
    result: results
  })
});

app.post('/api/manage/report', async (req, res) => {
  const {
    userId
  } = req.body
  // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
  const [results, metadata] = await db.sequelize.query(`select * from vw_tasks a where a.status_name = 'หายป่วยแล้ว' `);
  const headers = [{
      text: 'สถานะ',
      value: 'status_name'
    },
    // {
    //   text: 'ระดับอาการ',
    //   value: 'level_name'
    // },
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

  ];
  return res.json({
    result: results,
    headers
  })
});

app.post('/api/task/update', async (req, res) => {
  let data = req.body
  const task = await db.tasks.update({
    remark: data.remark,
    status_id: data.status_id,
    cancel_detail: data.cancel_detail,
    level: data.level,
    volunteer_id: data.volunteer_id
  }, {
    where: {
      id: data.id
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

app.post('/api/tasks/getbyId', async (req, res) => {

  const {
    id
  } = req.body;

  const result = await db.tasks.findOne({
    where: {
      id
    }
  });

  return res.json({
    result: result
  })
});

app.post('/api/Address/getAddress', async (req, res) => {
  //ยังไม่ได้เรียกใช้
  const data = req.body;
  console.log('data in ID', data)
  const result = await db.address.findOne({
    where: {
      id: data.id
    }
  });
  console.log('result = ', result)
  return res.json({
    result: result
  })
});


app.post('/api/Address/createAddress', async (req, res) => {
  //ยังไม่ได้เรียกใช้
  const data = req.body;
  console.log('data from body: ', data)
  const address = await db.address.create(data)
  console.log('data after add', address)

  return res.json({
    message: "success",
    result: address
  })
})

app.post('/api/user/getbyID', async (req, res) => {

  const data = req.body;
  console.log('data from body', data)

  if (data.group_id == '51b0e763-1f09-416a-afa9-d2f0ce78e9e6' || data.group_id == '87191711-d7ff-4664-b648-8e9bceaab5ea') {
    const [results, metadata] = await db.sequelize.query(`
    select a.first_name,
           a.last_name ,
           a.email,
           a.tel,
           b.id address_id,
           b.position,
           b.address_from_gmap,
           b.address_from_user
    from users a join address b on a.current_address = b.id
    where a.id = '${data.id}' `)
    console.log('result is: ', results)
    if (results == '') {
      return res.json({
        message: 'Not Found Data'
      })
    } else {
      return res.json({
        result: results[0],
        message: 'success'
        // headers
      })
    }
  } else {
    const results = await db.users.findOne({
      where: {
        id: data.id
      }
    });
    if (results == '') {
      return res.json({
        message: 'Not Found Data'
      })
    } else {
      return res.json({
        result: results,
        message: 'success'
      })
    }
  }
});

app.post('/api/user/update', async (req, res) => {

  const { data } = req.body;

  const address = await db.address.update({
    position: data.position,
    address_from_gmap: data.address_from_gmap,
    address_from_user: data.address_from_user
  }, {
    where: {
      id: data.address_id
    }
  })
  if (address) {
    const userInfo = await db.users.update({
      first_name: data.first_name,
      last_name: data.last_name,
      tel: data.tel
    }, {
      where: {
        id: data.user_id
      }
    })
    if (!userInfo) {
      return res.json({
        message: 'update user error'
      })
    } else {
      return res.json({
        result: true,
        message: 'update success'
      })
    }
  } else {
    return res.json({
      message: 'update address error'
    })
  }
});

app.post('/api/admin/alluser', async (req, res) => {
  const {
    userId
  } = req.body
  // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
  const [results, metadata] = await db.sequelize.query(`select * from vw_tasks_allUsers c where c."group_id" = '51b0e763-1f09-416a-afa9-d2f0ce78e9e6'`);
  const headers = [{
      text: 'สถานะ',
      value: 'status_name'
    },
    {
      text: 'ชื่อ',
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
      text: 'วันที่สร้าง',
      value: 'created_at'
    },

  ];
  console.log('xddsad', results)
  return res.json({
    result: results,
    headers

  })
});

app.post('/api/admin/allvolunteen', async (req, res) => {
  const {
    userId
  } = req.body
  // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
  const [results, metadata] = await db.sequelize.query(`select * from vw_tasks_allVa a where a."group_id" = '87191711-d7ff-4664-b648-8e9bceaab5ea'`);
  const headers = [{
      text: 'สถานะ',
      value: 'groups_name'
    },
    {
      text: 'ชื่อ',
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
  ];
  console.log('xddsad', results)
  return res.json({
    result: results,
    headers
  })
});

app.post('/api/user/request', async (req, res) => {
  const {data} = req.body;
  console.log('data from body', data)
  const address = await db.address.create(data)
  if (!address) {
    return res.json({
      message: 'create Address failed !'
    })
  } else {
    data.address_id = address.id
  }
  const status = await db.status.findOne({
    where: {
      name: data.status
    }
  })
  if (!status) {
    return res.json({
      message: 'Not Found Status !'
    })
  } else {
    data.status_id = status.id
  }
  const newTask = await db.tasks.create(data)
  if (!newTask) {
    return res.json({
      message: 'create newTask failed !'
    })
  } else {
    return res.json({
      message: 'success',
      result: true
    })
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})