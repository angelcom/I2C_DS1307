/**
* makecode I2C DS1307 package for microbit.
* From ling.
* http://www.lingsky.net
*/

enum DateTimeWeek {
    星期天 = 1,
    星期一 = 2,
    星期二 = 3,
    星期三 = 4,
    星期四 = 5,
    星期五 = 6,
    星期六 = 7,
}

 enum TimePart {
    second = 0,
    minute = 1,
    hour = 2,
    week = 3,
    day = 4,
    month = 5,
    year = 6
 }

/**
 * I2C DS1307 时钟
 */
//% weight=100 color=#090c11 
//% icon="႐"
namespace I2C_DS1307  {

    //I2C Slave Address
    const DS1307_ADDRESS: number = 0x68;

    //DS1307 Register Addresses
    const DS1307_REG_TIMEDATE: number = 0x00;
    const DS1307_REG_STATUS: number = 0x00;
    const DS1307_REG_CONTROL: number = 0x07;
    const DS1307_REG_RAMSTART: number = 0x08;
    const DS1307_REG_RAMEND: number = 0x3f;
    const DS1307_REG_RAMSIZE: number = DS1307_REG_RAMEND - DS1307_REG_RAMSTART;

    //DS1307 Register Data Size if not just 1
    const DS1307_REG_TIMEDATE_SIZE: number = 7;

    // DS1307 Control Register Bits
    const DS1307_RS0: number = 0;
    const DS1307_RS1: number = 1;
    const DS1307_SQWE: number = 4;
    const DS1307_OUT: number = 7;

    // DS1307 Status Register Bits
    const DS1307_CH: number = 7;

 enum DS1307SquareWaveOut {
        DS1307SquareWaveOut_1Hz = 0b00010000,
        DS1307SquareWaveOut_4kHz = 0b00010001,
        DS1307SquareWaveOut_8kHz = 0b00010010,
        DS1307SquareWaveOut_32kHz = 0b00010011,
        DS1307SquareWaveOut_High = 0b10000000,
        DS1307SquareWaveOut_Low = 0b00000000,
    };

    export function IsDateTimeValid(): boolean {
        return GetIsRunning();
    }

    export function GetIsRunning(): boolean {
        let sreg = getReg(DS1307_REG_STATUS);
        return !(sreg & _BV(DS1307_CH));
    }

    // function SetIsRunning(isRunning: boolean) {
    //     let sreg = getReg(DS1307_REG_STATUS);
    //     if (isRunning) {
    //         sreg &= ~_BV(DS1307_CH);
    //     }
    //     else {
    //         sreg |= _BV(DS1307_CH);
    //     }
    //     setReg(DS1307_REG_STATUS, sreg);
    // }


   export function SetTime(year: number, month: number, day: number, week: DateTimeWeek, hour: number, minute: number, second: number) {
        // retain running state
        let sreg = getReg(DS1307_REG_STATUS) & _BV(DS1307_CH);

        // set the date time
        let buf = pins.createBuffer(8)
        buf[0] = DS1307_REG_TIMEDATE
        buf[1] = second | sreg
        buf[2] = minute
        buf[3] = hour - 1
        buf[4] = week + 1
        buf[5] = day
        buf[6] = month
        buf[7] = year
        pins.i2cWriteBuffer(DS1307_ADDRESS, buf)
    }
    // void SetTime(time_t * now)
    // {
    //     struct tm now_tm;
    //     gmtime_r(now, & now_tm);
    //     SetTime(& now_tm);
    // }


    // void SetTimeUX(time_t * UXnow)
    // {
    //     time_t now = * UXnow - UNIX_OFFSET;
    //     SetTime(& now);
    // }
    // void SetTimeUX(time_t UXnow)
    // {
    //     SetTimeUX(& UXnow);
    // }

  /**
     * 获取时间部分
     * @param part 时间部分类型, TimePart.second
     */
    //% blockId="I2C_DS1307_GET_TimePart" block="目前时间的 %part"
    //% weight=90 blockGap=8
    //% icon="႐"
    export function GetTimePart(part: TimePart): number {
        let sreg = getReg(part);
        switch (part) {
            case TimePart.second:
                return BcdToUint8(sreg & 0x7F);
            case TimePart.minute:
                return BcdToUint8(sreg);
            case TimePart.hour:
                return BcdHourToUint8(sreg)+1;
            case TimePart.week:
                return sreg - 1;
            case TimePart.day:
                return BcdToUint8(sreg);
            case TimePart.month:
                return BcdToUint8(sreg) - 1;
            case TimePart.year:
                return BcdToUint8(sreg) ;  //?这个下次还要修正以下逻辑。。。2000年以前的

        }
        return 0;
    }

    export function GetTime(): string {
        let buf = pins.createBuffer(7)
        buf = pins.i2cReadBuffer(DS1307_ADDRESS, 7)

        let second = BcdToUint8(buf[0] & 0x7F);
        let minute = BcdToUint8(buf[1]);
        let hour = BcdHourToUint8(buf[2])+1;
        let week = buf[3] - 1;
        let day = BcdToUint8(buf[4]);
        let month = BcdToUint8(buf[5]) - 1;
        let year = BcdToUint8(buf[6]) ;

        return year + "/" + month + "/" + day + " " + hour + ":" + minute + ":" + second;
    }


    // time_t GetTimeUX()
    // {
    //     return (GetTime() + UNIX_OFFSET);
    // }


    // void GetLocalTime(struct tm * local_tm)
    // {
    //     time_t now = GetTime();
    //     localtime_r(& now, local_tm);
    // }


    // void SetSquareWavePin(DS1307SquareWaveOut pinMode)
    // {
    //     setReg(DS1307_REG_CONTROL, pinMode);
    // }
    // void SetMemory(uint8_t memoryAddress, uint8_t value)
    // {
    //     uint8_t address = memoryAddress + DS1307_REG_RAMSTART;
    //     if (address <= DS1307_REG_RAMEND) {
    //         setReg(address, value);
    //     }
    // }

    /* 内存相关先不处理
        uint8_t SetMemory(uint8_t memoryAddress, const uint8_t* pValue, uint8_t countBytes)
        {
            uint8_t address = memoryAddress + DS1307_REG_RAMSTART;
            uint8_t countWritten = 0;
            if (address <= DS1307_REG_RAMEND) {
                _wire.beginTransmission(DS1307_ADDRESS);
                _wire.write(address);
    
                while (countBytes > 0 && address <= DS1307_REG_RAMEND) {
                    _wire.write(* pValue++);
                    address++;
                    countBytes--;
                    countWritten++;
                }
    
                _wire.endTransmission();
            }
            return countWritten;
        }
    
    
        uint8_t GetMemory(uint8_t memoryAddress)
        {
            uint8_t value = 0;
            uint8_t address = memoryAddress + DS1307_REG_RAMSTART;
            if (address <= DS1307_REG_RAMEND) {
                value = getReg(address);
            }
            return value;
        }
    
    
        uint8_t GetMemory(uint8_t memoryAddress, uint8_t * pValue, uint8_t countBytes)
        {
            uint8_t address = memoryAddress + DS1307_REG_RAMSTART;
            uint8_t countRead = 0;
            if (address <= DS1307_REG_RAMEND) {
                if (countBytes > DS1307_REG_RAMSIZE) {
                    countBytes = DS1307_REG_RAMSIZE;
                }
    
                _wire.beginTransmission(DS1307_ADDRESS);
                _wire.write(address);
                _wire.endTransmission();
    
                _wire.requestFrom(DS1307_ADDRESS, countBytes);
    
                while (countBytes-- > 0) {
                    * pValue++ = _wire.read();
                    countRead++;
                }
            }
    
            return countRead;
        }
    */


    //--------------------------以下是私有方法
    function i2cWrite16(addr: number, reg: number, value: number) {
        pins.i2cWriteNumber(addr, reg * 256 | value, 9)
    }

    // 从robotbit找来的代码，看上去更科学一些。。。。
    function i2cwrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2ccmd(addr: number, value: number) {
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function getReg(regAddress: number): number {
        let regValue = i2cread(DS1307_ADDRESS, regAddress)
        return regValue;
    }

    function setReg(regAddress: number, regValue: number) {
        i2cWrite16(DS1307_ADDRESS, regAddress, regValue)
    }

    function BcdToUint8(val: number): number {
        return val - 6 * (val >> 4);
    }

    function Uint8ToBcd(val: number) {
        return val + 6 * (val / 10);
    }

    function BcdHourToUint8(bcdHour: number) {
        let hour = 0;
        if (bcdHour & 0x40) {
            // 12 hour mode, convert to 24
            let isPm = ((bcdHour & 0x20) != 0);

            hour = BcdToUint8(bcdHour & 0x1f);
            if (isPm) {
                hour += 12;
            }
        }
        else {
            hour = BcdToUint8(bcdHour);
        }
        return hour;
    }

    function _BV(b: number): number {
        return (1 << (b))
    }

}