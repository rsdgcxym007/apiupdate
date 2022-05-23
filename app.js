const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000
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

// app.get('/', async (req, res) => {
//   const result = await db.types.findAll();

//   result.forEach(x => {
//     x.created_at = moment(x.created_at).format("YYYY-MM-DD HH:mm:ss")
//     x.updated_at = moment(x.created_at).format("YYYY-MM-DD HH:mm:ss")
//   })

//   return res.json(result)
// })

app.get('/api/auth/user', jwt.verifytoken, async (req, res) => {
  const payload = req.jwtpayload
  return res.json(payload);
})

// app.get('/api/master/type', async (req, res) => {
//   const result = await db.types.findAll({
//     order: [
//       ["name", "asc"]
//     ]
//     // orderBy: [{
//     //   name: 'asc',
//     // }, ]
//   });

//   if (!result) {
//     return res.json({
//       result: null,
//       message: "error"
//     })
//   }

//   const items = result.map(function (item) {
//     return item['name'];
//   });
//   return res.json({
//     result: items,
//     message: "success"
//   })
// })

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
      password,
      status: 'active'
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
  data.status = 'active'
  if (!data.address_from_gmap || !data.position) {
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
    if (user.tel === tel) {
      message += !count ? 'เบอร์โทรนี้ถูกใช้ไปแล้ว' : ", " + 'เบอร์โทรนี้ถูกใช้ไปแล้ว'
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

app.post('/api/tasks/create', async (req, res) => {
  const {
    data
  } = req.body;
  console.log('data from body', data)
  if (data.congenital_disease == "") {
    data.congenital_disease = "ไม่มี"
  }
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
      message: 'create Task failed !'
    })
  } else {
    return res.json({
      message: 'success',
      result: true
    })
  }
});

app.post('/api/tasks/getAllByUserId', async (req, res) => {
  const {
    userId,
    statusName
  } = req.body;

  var queryStatus = "c.name = 'ขอความช่วยเหลือ' or c.name = 'ช่วยเหลือเสร็จสิ้น' or c.name = 'กำลังช่วยเหลือ' or c.name = 'ยกเลิก' or c.name = 'หายป่วยแล้ว'"
  if (statusName) {
    queryStatus = `c.name = '${statusName}'`
  }
  const [results, metadata] = await db.sequelize.query(`
    SELECT c.name AS status_name,
           c.color,
           concat(b.address_from_user, ' ', b.address_from_gmap) AS address,
           a.id,
           a.remark,
           a.user_id,
           a.status_id,
           a.address_id,
           to_char(timezone('Asia/Bangkok':: text, a.created_at), 'DD Mon YYYY HH24:MI:SS':: text) AS created_at,
           b.address_from_user,
           b.address_from_gmap,
           b.position
           
    FROM tasks a 
    JOIN address b on a.address_id = b.id
    JOIN status c on a.status_id = c.id
    WHERE a.user_id = '${userId}' and (${queryStatus})
    ORDER BY a.created_at DESC`)

  const headers = [{
      text: 'สถานะ',
      value: 'status_name'
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
      text: 'หมายเหตุ',
      value: 'warning'
    },
    {
      text: 'วันที่สร้าง',
      value: 'created_at'
    },
  ]

  return res.json({
    result: results,
    headers,
    message: 'get success'
  })
});

app.post('/api/tasks/getbyId', async (req, res) => {

  const {
    id
  } = req.body;
  console.log('data from body: ', id)
  // const results = await db.tasks.findOne({
  //   where: {
  //     id
  //   }
  // });
  const [results, metadata] = await db.sequelize.query(`
    SELECT a.*,
           b."position",
           b.address_from_gmap,
           b.address_from_user,
           C.first_name AS user_firstname,
           c.last_name AS user_lastname,
           c.tel AS user_tel,
           d.first_name AS volunteer_firstname,
           d.last_name AS volunteer_lastname,
           d.tel AS volunteer_tel,
           e.day_of_visit,
           e.hospital,
           e.image_rtpcr,
           e.image_medical

    FROM tasks a 
    JOIN address b on a.address_id = b.id
    JOIN users c on a.user_id = c.id
    LEFT JOIN users d on a.volunteer_id = d.id
    LEFT JOIN uploadimages e on a.img_id = e.id
    WHERE a.id = '${id}'`)
  console.log('result from: ', results)
  return res.json({
    result: results[0],
    message: 'api complete'
  })
});

app.post('/api/tasks/getAskForHelp', async (req, res) => {
  // เพิ่ม vw ใน postgres SQL ด้วย !!
  //   CREATE OR REPLACE VIEW public.vw_tasks_all_detail
  //    AS SELECT a.id,
  //     a.user_id,
  //     concat(b.first_name, ' ', b.last_name) AS name,
  //       b.tel,
  //       d.name AS status_name,
  //         d.color,
  //         a.remark,
  //         c."position",
  //           c.address_from_gmap,
  //           c.address_from_user,
  //           to_char(timezone('Asia/Bangkok':: text, a.created_at), 'DD Mon YYYY HH24:MI:SS':: text) AS created_at
  //    FROM tasks a
  //      JOIN users b ON a.user_id = b.id
  //      JOIN address c ON a.address_id = c.id
  //      JOIN status d ON a.status_id = d.id
  //   ORDER BY a.created_at DESC;

  const [results, metadata] = await db.sequelize.query(`select * from vw_tasks_all_detail a where a.status_name = 'ขอความช่วยเหลือ' `);
  if (!results) {
    return res.json({
      message: 'Not Found Data'
    })
  } else {
    const headers = [{
        text: 'วันที่ขอความช่วยเหลือ',
        value: 'created_at'
      },
      {
        text: 'สถานะ',
        value: 'status_name'
      }, {
        text: 'dsadsadsadas',
        value: 'level'
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
        value: 'address_from_gmap'
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
  }

});


app.post('/api/volunteen/takecareuser', async (req, res) => {
  const {
    userId,
    statusName
  } = req.body
  var queryStatus = "a.status_name = 'ช่วยเหลือเสร็จสิ้น' or a.status_name = 'กำลังช่วยเหลือ' or a.status_name = 'ยกเลิก' or a.status_name = 'หายป่วยแล้ว'"
  if (statusName) {
    queryStatus = `a.status_name = '${statusName}'`
  }
  // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
  const [results, metadata] = await db.sequelize.query(`
  select * from vw_tasks_volunteer a where a."volunteer_id" = '${userId}' and (${queryStatus})`);
  const headers = [{
      text: 'วันที่',
      value: 'created_at'
    },
    {
      text: 'สถานะ',
      value: 'status_name'
    },
    {
      text: 'ระดับอาการ',
      value: 'level'
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
    headers,
    length: results.length
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

app.post('/api/task/update', async (req, res) => {
  let data = req.body
  console.log('data from body', data)
  if (data.address_id) {
    console.log('update Address')
    const address = await db.address.update({
      position: data.position,
      address_from_gmap: data.address_from_gmap,
      address_from_user: data.address_from_user
    }, {
      where: {
        id: data.address_id
      }
    })
  }
  const task = await db.tasks.update({
    remark: data.remark,
    requirement: data.requirement,
    status_id: data.status_id,
    cancel_detail: data.cancel_detail,
    level: data.level,
    volunteer_id: data.volunteer_id,
    congenital_disease: data.congenital_disease,
    treatment_location: data.treatment_location,
    help_detail: data.help_detail,
    is_care_until_end: data.is_care_until_end
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

app.post('/api/uploadimages/create', async (req, res) => {

  const {
    data
  } = req.body;
  console.log('data from body: ', data)
  const image = await db.uploadimages.create(data)

  await db.tasks.update({
    img_id: image.id,
    status_id: data.status_id,

  }, {
    where: {
      id: data.task_id
    }
  })

  return res.json({
    result: true,
    message: "success"
  })
});

app.post('/api/uploadimages/getById', async (req, res) => {
  let data = req.body
  const results = await db.uploadimages.findOne({
    where: {
      id: data.id
    }
  });
  return res.json({
    result: results
  })
});

app.post('/api/users/getByUserId', async (req, res) => {

  const data = req.body;
  console.log('data from body', data)
  if (data.group_id == '51b0e763-1f09-416a-afa9-d2f0ce78e9e6' || data.group_id == '87191711-d7ff-4664-b648-8e9bceaab5ea' || data.group_id == '4e095238-1b60-4303-a207-8927d9c992d5') {
    const [results, metadata] = await db.sequelize.query(`
    select a.first_name,
    a.last_name,
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

app.post('/api/users/update', async (req, res) => {

  const {
    data
  } = req.body;

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

app.post('/api/user/getAll', async (req, res) => {

  // if (data.group_id == '51b0e763-1f09-416a-afa9-d2f0ce78e9e6') {
  const [results, metadata] = await db.sequelize.query(`
    select concat(a.first_name , ' ', a.last_name) AS name ,
           a.email,
           a.tel,
           a.status,
           b.id address_id,
           a.id,
           b.position,
           b.address_from_gmap,
           b.address_from_user
    from users a join address b on a.current_address = b.id where a.group_id = '51b0e763-1f09-416a-afa9-d2f0ce78e9e6' `)
  console.log('result is: ', results)
  const headers = [{
      text: 'ชื่อจริง-นามกสุล',
      value: 'name'
    },
    {
      text: 'เบอร์โทร',
      value: 'tel'
    },
    {
      text: 'ที่อยู่จากMap',
      value: 'address_from_gmap'
    },
    {
      text: 'สถานะ',
      value: 'actions',
      sortable: false
    },
    {
      text: 'ดูข้อมูล',
      value: 'actions1',
      sortable: false
    },
  ];
  if (results == '') {
    return res.json({
      message: 'Not Found Data'
    })
  } else {
    return res.json({
      result: results,
      headers,
      message: 'success'

    })
  }
  // } else {
  //   const results = await db.users.findOne({
  //     where: {
  //       id: data.id
  //     }
  //   });
  //   if (results == '') {
  //     return res.json({
  //       message: 'Not Found Data'
  //     })
  //   } else {
  //     return res.json({
  //       result: results,
  //       message: 'success'
  //     })
  //   }
  // }
});

app.post('/api/user/getAllVA', async (req, res) => {
  // if (data.group_id == '51b0e763-1f09-416a-afa9-d2f0ce78e9e6') {
  const [results, metadata] = await db.sequelize.query(`
    select concat(a.first_name , ' ', a.last_name) AS name ,
           a.email,
           a.tel,
           a.status,
           b.id address_id,
           a.id,
           b.position,
           b.address_from_gmap,
           b.address_from_user
    from users a join address b on a.current_address = b.id where a.group_id = '87191711-d7ff-4664-b648-8e9bceaab5ea' `)
  console.log('result is: ', results)
  const headers = [{
      text: 'ชื่อจริง-นามสกุล',
      value: 'name'
    },
    {
      text: 'เบอร์โทร',
      value: 'tel'
    },
    {
      text: 'ที่อยู่จากMap',
      value: 'address_from_gmap'
    },
    {
      text: 'สถานะ',
      value: 'actions',
      sortable: false
    },
    {
      text: 'ดูข้อมูล',
      value: 'actions1',
      sortable: false
    },
  ];
  if (results == '') {
    return res.json({
      message: 'Not Found Data'
    })
  } else {
    return res.json({
      result: results,
      headers,
      message: 'success'

    })
  }
  // } else {
  //   const results = await db.users.findOne({
  //     where: {
  //       id: data.id
  //     }
  //   });
  //   if (results == '') {
  //     return res.json({
  //       message: 'Not Found Data'
  //     })
  //   } else {
  //     return res.json({
  //       result: results,
  //       message: 'success'
  //     })
  //   }
  // }
});

app.post('/api/user/getAllv2', async (req, res) => {

  // if (data.group_id == '51b0e763-1f09-416a-afa9-d2f0ce78e9e6') {
  const [results, metadata] = await db.sequelize.query(`
    select a.first_name,
    a.last_name,
    a.email,
    a.tel,
    a.id,
    a.status,
    a.group_id,
    b.id address_id,
      b.position,
      b.address_from_gmap,
      b.address_from_user
    from users a join address b on a.current_address = b.id `)
  console.log('result is: ', results)
  const headers = [{
      text: 'ประเภท',
      value: 'group_id'
    },
    {
      text: 'ชื่อ',
      value: 'first_name'
    },
    {
      text: 'นามสกุล',
      value: 'last_name'
    },
    {
      text: 'เบอร์โทร',
      value: 'tel'
    },
    {
      text: 'อีเมล',
      value: 'email'
    },
    {
      text: 'สถานะ',
      value: 'actions',
      sortable: false
    },
  ];
  if (results == '') {
    return res.json({
      message: 'Not Found Data'
    })
  } else {
    return res.json({
      result: results,
      headers,
      message: 'success'

    })
  }
  // } else {
  //   const results = await db.users.findOne({
  //     where: {
  //       id: data.id
  //     }
  //   });
  //   if (results == '') {
  //     return res.json({
  //       message: 'Not Found Data'
  //     })
  //   } else {
  //     return res.json({
  //       result: results,
  //       message: 'success'
  //     })
  //   }
  // }
});

app.post('/api/user/getAllById', async (req, res) => {
  const {
    id
  } = req.body
  // if (data.group_id == '51b0e763-1f09-416a-afa9-d2f0ce78e9e6') {
  console.log('req.body', id)
  const [results, metadata] = await db.sequelize.query(`
    select a.first_name,
    a.last_name,
    a.email,
    a.tel,
    a.id,
    a.status,
    a.group_id,
    b.id address_id,
      b.position,
      b.address_from_gmap,
      b.address_from_user
    from users a join address b on a.current_address = b.id where a.id = '${id}' `)
  console.log('result is: ', results)

  if (results == '') {
    return res.json({
      message: 'Not Found Data'
    })
  } else {
    return res.json({
      result: results[0],
      message: 'success'

    })
  }
  // } else {
  //   const results = await db.users.findOne({
  //     where: {
  //       id: data.id
  //     }
  //   });
  //   if (results == '') {
  //     return res.json({
  //       message: 'Not Found Data'
  //     })
  //   } else {
  //     return res.json({
  //       result: results,
  //       message: 'success'
  //     })
  //   }
  // }
});


app.post('/api/upload', fileUpload.single('file'), async (req, res) => {
  //ไม่ได้ใช้แล้ว
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

app.post('/api/upload2', async (req, res) => {
  //ไม่ได้ใช้แล้ว
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

app.post('/api/Address/getAddress', async (req, res) => {

  // const data = req.body;
  // console.log('data in ID', data)
  const results = await db.address.findAll();
  console.log('position from results', results[0].position)

  const positions = results.position
  // const result = await db.address.findOne({
  //   where: {
  //     id: data.id
  //   }
  // });
  console.log('result = ', positions)
  return res.json({
    result: results
  })
});

app.post('/api/admin/ban', async (req, res) => {
  //ใช้ร่วมกับ api/users/update ได้
  let data = req.body
  console.log('status', data)
  const task = await db.users.update({
    status: data.status,
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

app.post('/api/admin/alluser', async (req, res) => {
  //ยังไม่มีการเรียกใช้
  const {
    userId
  } = req.body
  // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
  const [results, metadata] = await db.sequelize.query(`select * from vw_tasks_allUsers c where c."group_id" = '51b0e763-1f09-416a-afa9-d2f0ce78e9e6'`);
  const headers = [{
      text: 'id',
      value: 'id'
    },
    {
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
    // {
    //   text: 'ที่อยู่',
    //   value: 'address'
    // },
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
  //ไม่มีการเรียกใช้
  const {
    userId
  } = req.body
  // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
  const [results, metadata] = await db.sequelize.query(`select * from vw_tasks_allVa a where a."group_id" = '87191711-d7ff-4664-b648-8e9bceaab5ea'`);
  const headers = [{
      text: 'สถานะ',
      value: 'groups_Id'
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

// app.post('/api/volunteen/getbyuser', async (req, res) => {

//   const {
//     user_id
//   } = req.body;

//   const result = await db.tasks.findAll({
//     where: {
//       user_id
//     }
//   });

//   const items = result.map(function (item) {
//     return item['remark'];
//   });

//   return res.json({
//     result: items,
//     // headers
//   })
// });

// app.post('/api/volunteen/updatereport', async (req, res) => {
//   let data = req.body
//   // console.log('xxxxx', data)
//   const task = await db.tasks.update({
//     status_id: data.status_id
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

// app.post('/api/volunteen/notupdatereport', async (req, res) => {
//   let data = req.body
//   const taskx = await db.tasks.update({
//     status_id: data.status_id
//   }, {
//     where: {
//       id: data.id
//     }
//   })

//   return res.json({
//     result: true,
//     message: "update success"
//   })
// });

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

// app.post('/api/tasksvolunteen/getbyIduser', async (req, res) => {

//   const {
//     id
//   } = req.body;
//   const [result, metadata] = await db.sequelize.query(`
//   select * from vw_tasks a where a."id" = '${id}'
// `);

//   return res.json({
//     result: result[0]
//   })
// });

// app.post('/api/update/taskallbyuserid', async (req, res) => {
//   const {
//     userId
//   } = req.body
//   // const results = await prisma.$queryRawUnsafe(`select * from vw_tasks a where a."user_id" = $1`, userId)
//   const [results, metadata] = await db.sequelize.query(`select * from vw_tasks a where a."user_id" = '${userId}'`);
//   return res.json({
//     result: results,
//   })
// });

// app.post('/api/manage/updatetasks', async (req, res) => {
//   let data = req.body
//   console.log('data from: ', data)
//   const task = await db.tasks.update({
//     remark: data.remark,
//     cancel_detail: data.cancel_detail,
//     status_id: data.status_id
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
// app.post('/api/manage/request', async (req, res) => {
//   let data = req.body

//   const status = await db.status.findOne({
//     where: {
//       name: data.status_id
//     }
//   })

//   data.status_id = status.id

//   const type = await db.types.findOne({
//     where: {
//       name: data.type
//     }
//   })
//   delete data.type
//   data.type_id = type.id


//   const task = await db.tasks.create(data)


//   if (!task) {
//     return res.json({
//       result: false,
//       message: "request error"
//     })
//   }

//   return res.json({
//     result: true,
//     message: "request success"
//   })
// })

// app.post('/api/manage/update', async (req, res) => {
//   let data = req.body
//   const task = await db.tasks.update({
//     remark: data.remark,
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


app.post('/api/tasks/countByDay', async (req, res) => {

  // const [results, metadata] = await db.sequelize.query(`
  // select DATE_TRUNC ('day', created_at) AS date_Request, COUNT(created_at) AS total_Case 
  // FROM tasks 
  // GROUP BY DATE_TRUNC('day', created_at) 
  // order by Date_Request;`)

  const [results, metadata] = await db.sequelize.query(`
  SELECT DATE(created_at) date_request , count(created_at) total_case
  FROM tasks
  GROUP BY date_request
  ORDER BY date_request ;`)

  for (let i = 0; i < results.length; i++) {
    results[i].date_request = moment(results[i].date_request, 'YYYY-MM-DD').valueOf()
  }

  return res.json({
    result: results,
    message: 'get success'
  })
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})