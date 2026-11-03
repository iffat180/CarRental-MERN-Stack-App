interface TitleProps {
  title: string;
  subTitle: string;
  align?: "left" | "center";
}

const Title = ({ title, subTitle, align }: TitleProps) => {
  return (
    <div
      className={`flex flex-col justify-center items-center text-center ${
        align === "left" ? " md:items-start md:text-left" : ""
      }`}
    >
      <h1 className="text-3xl md:text-4xl leading-tight">{title}</h1>
      <p className="text-sm md:text-base text-gray-500 mt-3 max-w-156">{subTitle}</p>
    </div>
  );
};

export default Title;
